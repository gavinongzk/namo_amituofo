import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import * as XLSX from 'xlsx';
import crypto from 'crypto'; // <-- Import crypto
import { connectToDatabase } from '@/lib/database';
import UserDetails from '@/lib/database/models/userDetails.model';
import { z } from 'zod';

// Define the expected structure of a row in the Excel file using Zod
const userDetailsRowSchema = z.object({
    // Assuming column headers in Excel are 'Name', 'PhoneNumber', 'PostalCode', 'MembershipNumber', 'Remarks'
    // Adjust keys here if your Excel headers are different. Case-sensitive.
    Name: z.string().trim().min(1, { message: 'Name is required' }),
    PhoneNumber: z.string().trim().min(1, { message: 'Phone number is required' })
        // Add more specific phone number validation if needed, e.g., regex
        .refine(val => /^\+?[0-9\s\-()]+$/.test(val), { message: 'Invalid phone number format' }),
    PostalCode: z.string().trim().optional(),
    MembershipNumber: z.string().trim().optional(), // Added MembershipNumber (optional)
    Remarks: z.string().trim().optional(),
});

// --- Helper Functions ---

// Hash function (using SHA-256)
function hashData(data: string): string {
    return crypto.createHash('sha256').update(data).digest('hex');
}

// Masking function for phone number (e.g., keep last 4 digits)
function maskPhoneNumber(phoneNumber: string): string {
    const cleaned = phoneNumber.replace(/\D/g, ''); // Remove non-digits
    if (cleaned.length <= 4) {
        return '****'; // Or handle as invalid if needed
    }
    return `****${cleaned.slice(-4)}`;
}

// Masking function for postal code (e.g., mask last 2 chars)
function maskPostalCode(postalCode?: string): string | undefined {
    if (!postalCode || postalCode.length < 2) {
        return postalCode; // Return as is if too short or undefined
    }
    return `${postalCode.slice(0, -2)}**`;
}

// Type for the raw validated data from Excel
type RawValidatedUserDetails = {
    Name: string;
    PhoneNumber: string;
    PostalCode?: string;
    MembershipNumber?: string; // Added
    Remarks?: string;
};

// Type for the data prepared for DB insertion (hashed/masked)
type PreparedUserDetails = {
    name: string;
    phoneNumberHash: string;
    maskedPhoneNumber: string;
    maskedPostalCode?: string;
    membershipNumber?: string; // Added
    remarks?: string;
};

export async function POST(req: NextRequest) {
    console.log('POST /api/upload-user-details called'); // Added log

    try {
        // 1. Authentication & Authorization
        const { sessionClaims } = auth();
        const userId = sessionClaims?.sub;

        if (!userId) {
            console.error('Authentication failed: No user ID');
            return NextResponse.json({ message: 'Authentication required' }, { status: 401 });
        }

        // Check for admin role (adjust 'publicMetadata', 'role', and 'admin' based on your Clerk setup)
        const userRole = sessionClaims?.publicMetadata?.role; // Changed from metadata to publicMetadata
        if (userRole !== 'admin') {
            console.warn(`Authorization failed: User ${userId} role is ${userRole}, not admin`);
            return NextResponse.json({ message: 'Forbidden: Admin privileges required' }, { status: 403 });
        }
        console.log(`User ${userId} with role ${userRole} authorized.`);

        // 2. Get File from FormData
        const formData = await req.formData();
        const file = formData.get('file') as File | null;

        if (!file) {
            console.error('File upload error: No file found in request');
            return NextResponse.json({ message: 'No file uploaded' }, { status: 400 });
        }

        console.log(`Received file: ${file.name}, size: ${file.size}, type: ${file.type}`);

        // Check file type (optional but recommended)
        if (!['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel'].includes(file.type)) {
             console.error(`File type error: Invalid file type ${file.type}`);
             return NextResponse.json({ message: 'Invalid file type. Please upload an Excel file (.xlsx or .xls)' }, { status: 400 });
        }


        // 3. Read and Parse File
        const bytes = await file.arrayBuffer();
        const workbook = XLSX.read(bytes, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0]; // Assuming data is in the first sheet
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet); // Converts sheet to array of objects

        console.log(`Parsed ${jsonData.length} rows from sheet "${sheetName}".`);

        if (jsonData.length === 0) {
            return NextResponse.json({ message: 'Excel file is empty or has no data in the first sheet' }, { status: 400 });
        }

        // 4. Validate and Prepare Data
        const rawValidatedData: RawValidatedUserDetails[] = []; // Store raw validated data first
        const preparedDataForDb: PreparedUserDetails[] = []; // Store hashed/masked data for DB
        const validationErrors: { row: number; errors: string }[] = [];

        jsonData.forEach((row: any, index: number) => {
            const result = userDetailsRowSchema.safeParse(row);
            if (result.success) {
                // Store the raw validated data temporarily
                rawValidatedData.push(result.data);
            } else {
                // Collect validation errors
                const errorMessages = result.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
                validationErrors.push({ row: index + 2, errors: errorMessages }); // +2 because Excel rows are 1-based and header is row 1
                console.warn(`Validation failed for Excel row ${index + 2}: ${errorMessages}`);
            }
        });

        // If validation errors exist, return them without attempting DB insert
        if (validationErrors.length > 0) {
            console.error(`Found ${validationErrors.length} validation errors in the uploaded file.`);
            return NextResponse.json(
                {
                    message: `Validation failed for ${validationErrors.length} row(s). Please check the file and try again.`,
                    errors: validationErrors,
                },
                { status: 400 }
            );
        }

        console.log(`Successfully validated ${rawValidatedData.length} rows from Excel.`);

        // Now, hash and mask the validated data
        rawValidatedData.forEach(data => {
            const phoneNumberHash = hashData(data.PhoneNumber);
            const maskedPhoneNumber = maskPhoneNumber(data.PhoneNumber);
            const maskedPostalCode = maskPostalCode(data.PostalCode);

            preparedDataForDb.push({
                name: data.Name,
                phoneNumberHash: phoneNumberHash,
                maskedPhoneNumber: maskedPhoneNumber,
                maskedPostalCode: maskedPostalCode,
                membershipNumber: data.MembershipNumber, // Added
                remarks: data.Remarks,
            });
        });

        console.log(`Prepared ${preparedDataForDb.length} rows for database operation (hashed/masked).`);

        // 5. Database Interaction
        await connectToDatabase();
        console.log('Database connected.');

        let insertedCount = 0;
        let updatedCount = 0;
        let failedCount = 0;
        // Log original phone number in errors for easier debugging on the server, but don't return it
        const operationErrors: { originalPhoneNumber?: string, error: string }[] = [];

        // Use findOneAndUpdate with upsert to handle existing records based on phone number HASH
        for (const dbData of preparedDataForDb) {
             // Find the corresponding raw data to log original phone in case of error
            const rawData = rawValidatedData.find(r => hashData(r.PhoneNumber) === dbData.phoneNumberHash);
            try {
                const result = await UserDetails.findOneAndUpdate(
                    { phoneNumberHash: dbData.phoneNumberHash }, // Find by unique phone number HASH
                    { $set: dbData }, // Update with HASHED/MASKED data
                    { upsert: true, new: true, runValidators: true } // Create if not found, return new doc, run schema validators
                );

                // Determine if it was an insert or update based on createdAt/updatedAt timestamps
                // Mongoose upsert doesn't directly tell you if it inserted or updated in a simple flag
                // We compare createdAt and updatedAt. If they are very close, it's likely an insert.
                // A more robust way might involve checking if result._id existed before the operation,
                // but this timestamp check is usually sufficient.
                const timeDifference = Math.abs(result.updatedAt.getTime() - result.createdAt.getTime());
                if (timeDifference < 1000) { // Less than 1 second difference likely means insert
                    insertedCount++;
                } else {
                    updatedCount++;
                }
            } catch (error: any) {
                failedCount++;
                const errorMessage = error.message || 'Unknown database error';
                // Include original phone number in server-side log/error object for debugging
                operationErrors.push({ originalPhoneNumber: rawData?.PhoneNumber, error: errorMessage });
                console.error(`Database operation failed for phone hash ${dbData.phoneNumberHash} (Original: ${rawData?.PhoneNumber}): ${errorMessage}`, error);
                // Decide if you want to stop on first error or continue processing others
                // continue; // Uncomment to continue processing other rows even if one fails
            }
        }

        console.log(`Database operations complete: Inserted: ${insertedCount}, Updated: ${updatedCount}, Failed: ${failedCount}`);

        // 6. Return Summary - DO NOT include sensitive original data in the response
        const clientSafeOperationErrors = operationErrors.map(({ error }) => ({ error })); // Only return error message

        const responsePayload: any = {
            message: `Upload processed. Rows processed: ${preparedDataForDb.length}. Inserted: ${insertedCount}. Updated: ${updatedCount}. Failed: ${failedCount}.`,
            inserted: insertedCount,
            updated: updatedCount,
            failed: failedCount,
        };

        if (failedCount > 0) {
            responsePayload.operationErrors = clientSafeOperationErrors; // Return only safe error messages
        }

        return NextResponse.json(responsePayload, { status: failedCount > 0 ? 207 : 200 }); // 207 Multi-Status if some failed

    } catch (error: any) {
        console.error('Unhandled error during user details upload:', error);
        // Log the specific error type and message if available
        const errorMessage = error.message || 'An unexpected error occurred';
        const errorStack = error.stack; // Log stack trace for debugging
        console.error(`Error details: ${errorMessage}\nStack: ${errorStack}`);

        return NextResponse.json({ message: `Upload failed: ${errorMessage}` }, { status: 500 });
    }
}
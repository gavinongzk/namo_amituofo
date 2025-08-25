export default async function EnvTestPage() {
  const envVars = {
    MONGODB_URI: process.env.MONGODB_URI ? 'Set' : 'Not Set',
    NODE_ENV: process.env.NODE_ENV,
    NEXT_PUBLIC_SERVER_URL: process.env.NEXT_PUBLIC_SERVER_URL,
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Environment Variables Test</h1>
      <div className="space-y-4">
        <p><strong>MONGODB_URI:</strong> {envVars.MONGODB_URI}</p>
        <p><strong>NODE_ENV:</strong> {envVars.NODE_ENV}</p>
        <p><strong>NEXT_PUBLIC_SERVER_URL:</strong> {envVars.NEXT_PUBLIC_SERVER_URL}</p>
        <div className="mt-4">
          <h2 className="text-lg font-semibold mb-2">All Environment Variables:</h2>
          <pre className="bg-gray-100 p-4 rounded overflow-auto text-sm">
            {JSON.stringify(process.env, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
}

'use client'

import { useCallback, Dispatch, SetStateAction } from 'react'
import { useDropzone } from '@uploadthing/react/hooks'
import { generateClientDropzoneAccept } from 'uploadthing/client'

import { Button } from '@/components/ui/button'
import { convertFileToUrl } from '@/lib/utils'

type FileUploaderProps = {
  onFieldChange: (url: string) => void
  imageUrl: string
  setFiles: Dispatch<SetStateAction<File[]>>
}

export function FileUploader({ imageUrl, onFieldChange, setFiles }: FileUploaderProps) {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFiles(acceptedFiles)
    onFieldChange(convertFileToUrl(acceptedFiles[0]))
  }, [])

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: generateClientDropzoneAccept(['image/*']),
  })

  return (
    <div
      {...getRootProps()}
      className="flex-center bg-dark-3 flex h-72 cursor-pointer flex-col overflow-hidden rounded-xl bg-grey-50">
      <input {...getInputProps()} className="cursor-pointer" />

      {imageUrl ? (
        <div className="flex h-full w-full flex-1 justify-center items-center">
          <img
            src={imageUrl}
            alt="image"
            className="max-h-full max-w-full object-contain"
          />
        </div>
      ) : (
        <div className="flex-center flex-col py-5 text-grey-500 text-center px-4">
          <img src="/assets/icons/upload.svg" width={77} height={77} alt="file upload" className="w-16 h-16 sm:w-20 sm:h-20" />
          <h3 className="mb-2 mt-2 text-sm sm:text-base">Drag photo here</h3>
          <p className="text-xs sm:text-sm mb-4">SVG, PNG, JPG</p>
          <Button type="button" className="rounded-full text-xs sm:text-sm">
            <span className="truncate">Select from computer</span>
          </Button>
        </div>
      )}
    </div>
  )
}

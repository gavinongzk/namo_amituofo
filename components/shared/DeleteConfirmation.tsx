'use client'

import { useTransition } from 'react'
import { usePathname } from 'next/navigation'
import Image from 'next/image'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

import { deleteEvent } from '@/lib/actions/event.actions'

export const DeleteConfirmation = ({ eventId }: { eventId: string }) => {
  const pathname = usePathname()
  let [isPending, startTransition] = useTransition()

  return (
    <AlertDialog>
      <AlertDialogTrigger>
        <Image src="/assets/icons/delete.svg" alt="edit" width={20} height={20} />
      </AlertDialogTrigger>

      <AlertDialogContent className="bg-white max-w-[90vw] sm:max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-center sm:text-left">
            <span className="block sm:inline">您确定要删除吗？</span>
            <span className="block sm:inline sm:ml-1">Are you sure you want to delete?</span>
          </AlertDialogTitle>
          <AlertDialogDescription className="p-regular-16 text-grey-600 text-center sm:text-left">
            <span className="block sm:inline">此操作将永久删除此活动。</span>
            <span className="block sm:inline sm:ml-1">This will permanently delete this event.</span>
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
          <AlertDialogCancel className="w-full sm:w-auto">
            <span className="block sm:inline">取消</span>
            <span className="block sm:inline sm:ml-1">Cancel</span>
          </AlertDialogCancel>

          <AlertDialogAction
            className="w-full sm:w-auto"
            onClick={() =>
              startTransition(async () => {
                await deleteEvent({ eventId, path: pathname })
              })
            }>
            {isPending ? (
              <span className="flex flex-col sm:flex-row text-xs sm:text-sm">
                <span>删除中...</span>
                <span>Deleting...</span>
              </span>
            ) : (
              <span className="flex flex-col sm:flex-row text-xs sm:text-sm">
                <span>删除</span>
                <span>Delete</span>
              </span>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

'use client'

import { useEffect } from 'react'
import { useToast } from '@/hooks/use-toast'
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from '@/components/ui/toast'

export function Toaster() {
  const { toasts, dismiss } = useToast()

  // Clean up any empty toasts on mount and when toasts change
  useEffect(() => {
    toasts.forEach((toast) => {
      if (!toast.title && !toast.description) {
        dismiss(toast.id)
      }
    })
  }, [toasts, dismiss])

  // Filter out toasts without content
  const validToasts = toasts.filter((toast) => toast.title || toast.description)

  return (
    <ToastProvider>
      {validToasts.map(function ({ id, title, description, action, ...props }) {
        return (
          <Toast key={id} {...props}>
            <div className="grid gap-1">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && (
                <ToastDescription>{description}</ToastDescription>
              )}
            </div>
            {action}
            <ToastClose />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}

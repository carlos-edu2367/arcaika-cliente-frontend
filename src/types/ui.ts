export type ToastType = 'success' | 'error' | 'warning' | 'info'
export interface Toast { id: string; type: ToastType; title: string; message?: string; duration?: number }
export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
export type ButtonSize = 'sm' | 'md' | 'lg'
export type BadgeVariant = 'primary' | 'success' | 'warning' | 'danger' | 'neutral'
export type ModalSize = 'sm' | 'md' | 'lg' | 'full'

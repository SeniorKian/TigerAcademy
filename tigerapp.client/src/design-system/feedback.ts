import Swal from 'sweetalert2';
import 'sweetalert2/dist/sweetalert2.min.css';
import './feedback.css';

const dialog = Swal.mixin({
  buttonsStyling: false,
  confirmButtonText: 'متوجه شدم',
  cancelButtonText: 'انصراف',
  heightAuto: false,
  returnFocus: true,
  keydownListenerCapture: true,
  customClass: {
    container: 'tiger-alert-container', popup: 'tiger-alert', title: 'tiger-alert-title',
    htmlContainer: 'tiger-alert-text', actions: 'tiger-alert-actions',
    confirmButton: 'tiger-alert-confirm', cancelButton: 'tiger-alert-cancel',
    input: 'tiger-alert-input', validationMessage: 'tiger-alert-validation',
  },
});

export function apiErrorMessage(error: unknown, fallback = 'عملیات انجام نشد؛ دوباره تلاش کنید.'): string {
  const data = (error as { response?: { data?: { message?: string; errors?: string[] } | string } })?.response?.data;
  if (typeof data === 'string') return data;
  return data?.message || (Array.isArray(data?.errors) ? data.errors.join('؛ ') : '') || fallback;
}

interface ConfirmOptions {
  title: string;
  text: string;
  confirmText?: string;
  danger?: boolean;
  onConfirm?: () => Promise<unknown>;
}

export async function confirmAction({ title, text, confirmText = 'بله، غیرفعال شود', danger = true, onConfirm }: ConfirmOptions): Promise<boolean> {
  const result = await dialog.fire({
    titleText: title, text, icon: danger ? 'warning' : 'question',
    showCancelButton: true, focusCancel: true, focusConfirm: false,
    confirmButtonText: confirmText,
    allowOutsideClick: false,
    allowEscapeKey: () => !Swal.isLoading(),
    showLoaderOnConfirm: Boolean(onConfirm),
    didOpen: popup => { popup.dataset.tone = danger ? 'danger' : 'primary'; },
    preConfirm: onConfirm ? async () => {
      try { await onConfirm(); return true; }
      catch (error) { Swal.showValidationMessage(apiErrorMessage(error)); return false; }
    } : undefined,
  });
  return result.isConfirmed;
}

export async function showError(text: string): Promise<void> {
  await dialog.fire({ titleText: 'عملیات انجام نشد', text, icon: 'error' });
}

export function showSuccess(title: string): void {
  void dialog.fire({ titleText: title, icon: 'success', toast: true, position: 'top-end',
    backdrop: false, showConfirmButton: false, timer: 2600, timerProgressBar: true,
    didOpen: popup => {
      popup.closest('.swal2-container')?.classList.add('tiger-toast-container');
      popup.addEventListener('mouseenter', Swal.stopTimer);
      popup.addEventListener('mouseleave', Swal.resumeTimer);
    },
  });
}

export async function requestUrl(title: string, validate: (value: string) => string | null): Promise<string | null> {
  const result = await dialog.fire({ titleText: title, input: 'text', inputLabel: 'آدرس کامل', inputValue: 'https://',
    inputAttributes: { dir: 'ltr', autocomplete: 'off' }, inputValidator: value => validate(value),
    showCancelButton: true, confirmButtonText: 'درج', allowOutsideClick: false,
  });
  return result.isConfirmed ? String(result.value).trim() : null;
}

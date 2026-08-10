import { useSnackbar, VariantType } from 'notistack';

export function useToast() {
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();

  const showToast = (message: string, variant: VariantType = 'default') => {
    enqueueSnackbar(message, {
      variant,
      autoHideDuration: 4000,
      anchorOrigin: { vertical: 'bottom', horizontal: 'right' },
    });
  };

  return {
    toastSuccess: (msg: string) => showToast(msg, 'success'),
    toastError: (msg: string) => showToast(msg, 'error'),
    toastInfo: (msg: string) => showToast(msg, 'info'),
    toastWarning: (msg: string) => showToast(msg, 'warning'),
    closeSnackbar,
  };
}

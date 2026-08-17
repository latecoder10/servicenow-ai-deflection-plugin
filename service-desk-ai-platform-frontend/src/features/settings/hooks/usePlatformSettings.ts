import { useCallback, useEffect, useMemo, useState } from 'react';
import { apiGetSettings, apiPutSettings, apiResetSetting } from '../../../api/apiSettings';
import { SettingsResponse } from '../../../types/settings';
import { useToast } from '../../../hooks/useToast';

/**
 * Settings form state.
 *
 * Edits are held locally and only the fields that actually changed are sent, so saving
 * one value cannot silently rewrite another that a colleague changed in the meantime.
 */
export function usePlatformSettings() {
  const [data, setData] = useState<SettingsResponse | null>(null);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toastSuccess, toastError, toastWarning } = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    const { data: result, error: err } = await apiGetSettings();
    if (err) {
      setError(err.detail);
    } else {
      setData(result);
      setError(null);
      setDrafts({});   // server state is authoritative again
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  /** The value shown in a field: the local edit if there is one, else the server value. */
  const valueOf = useCallback(
    (key: string, serverValue: string | null) =>
      drafts[key] !== undefined ? drafts[key] : (serverValue ?? ''),
    [drafts]
  );

  const setDraft = useCallback((key: string, value: string) => {
    setDrafts((prev) => ({ ...prev, [key]: value }));
  }, []);

  /** Only genuinely-changed fields, so an untouched form saves nothing. */
  const changed = useMemo(() => {
    if (!data) return {};
    const result: Record<string, string> = {};
    for (const category of data.categories) {
      for (const setting of category.settings) {
        const draft = drafts[setting.key];
        if (draft !== undefined && draft !== (setting.value ?? '')) {
          result[setting.key] = draft;
        }
      }
    }
    return result;
  }, [data, drafts]);

  const dirtyCount = Object.keys(changed).length;

  const save = useCallback(async () => {
    if (dirtyCount === 0) return;
    setSaving(true);
    const { data: result, error: err } = await apiPutSettings(changed);
    setSaving(false);

    if (err) {
      toastError(err.detail);
      return;
    }
    // The backend reports which saved settings need a restart; surfacing that matters
    // more than a generic success message, since the change looks applied but is not.
    const message = result?.message ?? 'Settings saved';
    if (result?.restartRequired?.length) {
      toastWarning(message);
    } else {
      toastSuccess(message);
    }
    await load();
  }, [changed, dirtyCount, load, toastError, toastSuccess, toastWarning]);

  const reset = useCallback(
    async (key: string) => {
      const { error: err } = await apiResetSetting(key);
      if (err) {
        toastError(err.detail);
        return;
      }
      toastSuccess('Reverted to the deployed value');
      await load();
    },
    [load, toastError, toastSuccess]
  );

  const discard = useCallback(() => setDrafts({}), []);

  return {
    data, loading, saving, error, dirtyCount,
    valueOf, setDraft, save, reset, discard, reload: load,
  };
}

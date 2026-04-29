"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";
import { useCsrfToken } from "@/lib/useCsrfToken";
import { calculateMacroTargets } from "@/lib/calculations";
import { Link } from "@/i18n/navigation";

type ProfileFormData = {
  sex: "MALE" | "FEMALE" | "";
  age: string;
  heightCm: string;
  weightKg: string;
  activityLevel: "SEDENTARY" | "LIGHT" | "MODERATE" | "VERY_ACTIVE" | "EXTRA_ACTIVE" | "";
  goalType: "MAINTAIN" | "LOSE_WEIGHT" | "GAIN_MUSCLE" | "";
};

const defaultFormData: ProfileFormData = {
  sex: "",
  age: "",
  heightCm: "",
  weightKg: "",
  activityLevel: "",
  goalType: "",
};

export default function ProfileForm() {
  const t = useTranslations("Onboarding");
  const locale = useLocale();
  const { csrfToken } = useCsrfToken();

  const [formData, setFormData] = useState<ProfileFormData>(defaultFormData);
  const [profileReady, setProfileReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [redirectIn, setRedirectIn] = useState(5);
  const [error, setError] = useState<string | null>(null);

  // Account deletion state
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleteSuccess, setDeleteSuccess] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Password change state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);

  // Handle password change
  async function handleChangePassword() {
    setPasswordLoading(true);
    setPasswordError(null);
    setPasswordSuccess(false);

    if (newPassword !== confirmNewPassword) {
      setPasswordError(t("passwordMismatch"));
      setPasswordLoading(false);
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError("Password must be at least 6 characters");
      setPasswordLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/account/password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await res.json();

      if (!res.ok || !data.ok) {
        throw new Error(data.message);
      }

      setPasswordSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
      setTimeout(() => {
        setShowPasswordForm(false);
        setPasswordSuccess(false);
      }, 3000);
    } catch (err) {
      console.error(err);
      setPasswordError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setPasswordLoading(false);
    }
  }

  // Handle account deletion
  async function handleDeleteAccount() {
    setDeleteLoading(true);
    setDeleteError(null);

    try {
      const res = await fetch("/api/account/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: deletePassword }),
      });

      const data = await res.json();

      if (!res.ok || !data.ok) {
        throw new Error(data.message);
      }

      setDeleteSuccess(true);
      // Redirect to login after successful deletion
      setTimeout(() => {
        window.location.href = `/${locale}/login`;
      }, 2000);
    } catch (err) {
      console.error(err);
      setDeleteError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setDeleteLoading(false);
    }
  }

  // Load existing profile on mount (defer form UI until fetch completes to avoid default-value flash)
  useEffect(() => {
    let cancelled = false;

    async function loadProfile() {
      try {
        const res = await fetch("/api/profile");
        const data = await res.json();
        if (cancelled) return;
        if (res.ok && data.ok && data.data?.profile) {
          setFormData({
            sex: data.data.profile.sex ?? defaultFormData.sex,
            age:
              typeof data.data.profile.age === "number"
                ? String(data.data.profile.age)
                : defaultFormData.age,
            heightCm:
              typeof data.data.profile.heightCm === "number"
                ? String(data.data.profile.heightCm)
                : defaultFormData.heightCm,
            weightKg:
              typeof data.data.profile.weightKg === "number"
                ? String(data.data.profile.weightKg)
                : defaultFormData.weightKg,
            activityLevel: data.data.profile.activityLevel ?? defaultFormData.activityLevel,
            goalType: data.data.goal?.goalType ?? defaultFormData.goalType,
          });
        }
      } catch (err) {
        console.error("Failed to load profile:", err);
      } finally {
        if (!cancelled) {
          setProfileReady(true);
        }
      }
    }
    loadProfile();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!saveSuccess) return;
    if (redirectIn <= 0) return;
    const timer = setTimeout(() => {
      setRedirectIn((prev) => prev - 1);
    }, 1000);
    return () => clearTimeout(timer);
  }, [redirectIn, saveSuccess]);

  useEffect(() => {
    if (saveSuccess && redirectIn === 0) {
      window.location.href = `/${locale}/dashboard`;
    }
  }, [redirectIn, saveSuccess, locale]);

  const calculatedTargets = useMemo(() => {
    if (!formData.sex || !formData.activityLevel || !formData.goalType) {
      return { dailyCalories: 0, proteinTarget: 0, carbsTarget: 0, fatTarget: 0 };
    }
    const age = Number(formData.age) || 0;
    const heightCm = Number(formData.heightCm) || 0;
    const weightKg = Number(formData.weightKg) || 0;
    return calculateMacroTargets(
      {
        age,
        sex: formData.sex,
        heightCm,
        weightKg,
        activityLevel: formData.activityLevel,
      },
      formData.goalType
    );
  }, [formData.age, formData.sex, formData.heightCm, formData.weightKg, formData.activityLevel, formData.goalType]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSaveSuccess(false);

    if (!csrfToken) {
      setError("Security error: CSRF token not available");
      setLoading(false);
      return;
    }

    try {
      if (!formData.sex || !formData.activityLevel || !formData.goalType) {
        throw new Error(t("selectRequiredDropdowns"));
      }
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "x-csrf-token": csrfToken,
        },
        credentials: "include",
        body: JSON.stringify({
          ...formData,
          sex: formData.sex,
          age: Number(formData.age),
          heightCm: Number(formData.heightCm),
          weightKg: Number(formData.weightKg),
          activityLevel: formData.activityLevel,
          goalType: formData.goalType,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to save profile");
      setRedirectIn(5);
      setSaveSuccess(true);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  if (!profileReady) {
    return (
      <div className="mx-auto max-w-2xl rounded-xl border border-border bg-surface p-6 ambient-shadow">
        <div className="animate-pulse space-y-4" aria-busy="true" aria-live="polite">
          <div className="h-8 w-48 rounded bg-surface-soft" />
          <div className="h-10 w-full rounded bg-surface-soft" />
          <div className="h-10 w-full rounded bg-surface-soft" />
          <div className="h-10 w-full rounded bg-surface-soft" />
          <div className="h-10 w-full rounded bg-surface-soft" />
          <div className="h-10 w-full rounded bg-surface-soft" />
          <div className="h-10 w-full rounded bg-surface-soft" />
          <div className="h-11 w-full rounded bg-surface-soft" />
        </div>
        <p className="sr-only">{t("loadingProfile")}</p>
      </div>
    );
  }

  if (saveSuccess) {
    return (
      <div className="mx-auto max-w-2xl rounded-xl border border-border bg-surface p-6 ambient-shadow md:p-8">
        <h1 className="font-display text-2xl font-semibold text-brand">{t("profileCompleteTitle")}</h1>
        <p className="mt-2 text-sm text-ink-muted">{t("profileCompleteSubtitle")}</p>
        <p className="mt-2 text-xs text-ink-muted">
          {t("dashboardRedirectHint", { seconds: redirectIn })}
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/dashboard" className="btn-brand inline-flex">
            {t("continueToDashboard")}
          </Link>
          <button
            type="button"
            className="rounded-lg border border-border bg-surface px-4 py-2.5 text-sm font-semibold text-brand transition hover:bg-surface-soft"
            onClick={() => setSaveSuccess(false)}
          >
            {t("editProfileAgain")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl rounded-xl border border-border bg-surface p-6 ambient-shadow md:p-8">
      <h1 className="mb-6 font-display text-2xl font-semibold text-brand">{t("title")}</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label-stitch">{t("sex")}</label>
          <select name="sex" value={formData.sex} onChange={handleChange} className="input-stitch" required>
            <option value="" disabled>
              {t("selectSex")}
            </option>
            <option value="MALE">{t("male")}</option>
            <option value="FEMALE">{t("female")}</option>
          </select>
        </div>

        <div>
          <label className="label-stitch">{t("age")}</label>
          <input
            type="number"
            name="age"
            value={formData.age}
            onChange={handleChange}
            className="input-stitch placeholder:text-ink-muted/60"
            placeholder={t("agePlaceholder")}
          />
        </div>

        <div>
          <label className="label-stitch">{t("height")}</label>
          <input
            type="number"
            name="heightCm"
            value={formData.heightCm}
            onChange={handleChange}
            className="input-stitch placeholder:text-ink-muted/60"
            placeholder={t("heightPlaceholder")}
          />
        </div>

        <div>
          <label className="label-stitch">{t("weight")}</label>
          <input
            type="number"
            name="weightKg"
            value={formData.weightKg}
            onChange={handleChange}
            className="input-stitch placeholder:text-ink-muted/60"
            placeholder={t("weightPlaceholder")}
          />
        </div>

        <div>
          <label className="label-stitch">{t("activityLevel")}</label>
          <select
            name="activityLevel"
            value={formData.activityLevel}
            onChange={handleChange}
            className="input-stitch"
            required
          >
            <option value="" disabled>
              {t("selectActivityLevel")}
            </option>
            <option value="SEDENTARY">{t("sedentary")}</option>
            <option value="LIGHT">{t("light")}</option>
            <option value="MODERATE">{t("moderate")}</option>
            <option value="VERY_ACTIVE">{t("veryActive")}</option>
            <option value="EXTRA_ACTIVE">{t("extraActive")}</option>
          </select>
        </div>

        <div>
          <label className="label-stitch">{t("goalType")}</label>
          <select name="goalType" value={formData.goalType} onChange={handleChange} className="input-stitch" required>
            <option value="" disabled>
              {t("selectGoalType")}
            </option>
            <option value="MAINTAIN">{t("maintain")}</option>
            <option value="LOSE_WEIGHT">{t("loseWeightFat")}</option>
            <option value="GAIN_MUSCLE">{t("gainMuscle")}</option>
          </select>
        </div>

        <button type="submit" disabled={loading} className="btn-brand-lg mt-2 w-full py-3.5 disabled:opacity-50">
          {loading ? t("saving") : t("submit")}
        </button>
      </form>

      <section className="mt-8 rounded-xl border border-border bg-surface-soft p-5">
        <h2 className="mb-3 font-display text-lg font-semibold text-brand">{t("currentTargetSummary")}</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-border bg-surface p-4 ambient-shadow">
            <p className="text-sm text-ink-muted">{t("dailyCalories")}</p>
            <p className="mt-2 font-display text-2xl font-bold text-brand">{calculatedTargets.dailyCalories.toFixed(0)} kcal</p>
          </div>
          <div className="rounded-xl border border-border bg-surface p-4 ambient-shadow">
            <p className="text-sm text-ink-muted">{t("dailyProtein")}</p>
            <p className="mt-2 font-display text-2xl font-bold text-brand">{calculatedTargets.proteinTarget.toFixed(0)} g</p>
          </div>
          <div className="rounded-xl border border-border bg-surface p-4 ambient-shadow">
            <p className="text-sm text-ink-muted">{t("dailyCarbs")}</p>
            <p className="mt-2 font-display text-2xl font-bold text-brand">{calculatedTargets.carbsTarget.toFixed(0)} g</p>
          </div>
          <div className="rounded-xl border border-border bg-surface p-4 ambient-shadow">
            <p className="text-sm text-ink-muted">{t("dailyFat")}</p>
            <p className="mt-2 font-display text-2xl font-bold text-brand">{calculatedTargets.fatTarget.toFixed(0)} g</p>
          </div>
        </div>
      </section>

      {/* Account Settings Section */}
      <section className="mt-8 rounded-xl border border-border bg-surface-soft p-5">
        <h2 className="mb-4 font-display text-lg font-semibold text-brand">{t("accountSettings")}</h2>

        {/* Password Change */}
        {!showPasswordForm && !showDeleteConfirm ? (
          <button
            type="button"
            onClick={() => setShowPasswordForm(true)}
            className="text-sm text-ink-muted underline-offset-2 hover:text-brand hover:underline transition-colors"
          >
            {t("changePassword")}
          </button>
        ) : showDeleteConfirm ? null : (
          <div className="rounded-2xl border border-brand/20 bg-surface p-5">
            <h3 className="mb-3 text-base font-semibold text-brand">{t("changePassword")}</h3>
            <p className="mb-4 text-sm text-ink-muted">{t("enterCurrentPassword")}</p>

            <div className="space-y-3">
              <div>
                <label className="label-stitch">{t("currentPassword")}</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="input-stitch placeholder:text-ink-muted/60"
                  placeholder={t("enterCurrentPassword")}
                />
              </div>
              <div>
                <label className="label-stitch">{t("newPassword")}</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="input-stitch placeholder:text-ink-muted/60"
                  placeholder={t("enterNewPassword")}
                />
              </div>
              <div>
                <label className="label-stitch">{t("confirmNewPassword")}</label>
                <input
                  type="password"
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  className="input-stitch placeholder:text-ink-muted/60"
                  placeholder={t("confirmPasswordPlaceholder")}
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleChangePassword}
                  disabled={passwordLoading || !currentPassword || !newPassword || !confirmNewPassword}
                  className="flex-1 rounded-lg border border-brand bg-brand px-4 py-2 text-white hover:opacity-90 disabled:opacity-50"
                >
                  {passwordLoading ? t("changing") : t("savePassword")}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowPasswordForm(false);
                    setCurrentPassword("");
                    setNewPassword("");
                    setConfirmNewPassword("");
                    setPasswordError(null);
                  }}
                  className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-700 hover:bg-gray-50"
                >
                  {t("cancel")}
                </button>
              </div>
            </div>

            {passwordError && (
              <div className="mt-4 rounded-lg border border-red-300 bg-red-50 p-3 text-red-700">
                {passwordError}
              </div>
            )}

            {passwordSuccess && (
              <div className="mt-4 rounded-lg border border-green-300 bg-green-50 p-3 text-green-700">
                {t("passwordChanged")}
              </div>
            )}
          </div>
        )}

        {/* Divider */}
        <div className="my-5 h-px bg-border"></div>

        {/* Account Deletion */}
        {!showDeleteConfirm ? (
          <button
            type="button"
            onClick={() => setShowDeleteConfirm(true)}
            className="text-sm text-red-600 underline-offset-2 hover:text-red-700 hover:underline transition-colors"
          >
            {t("deleteAccount")}
          </button>
        ) : (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-5">
            <h3 className="mb-3 text-base font-semibold text-red-700">{t("deleteAccount")}</h3>
            <p className="mb-4 text-sm text-gray-600">{t("deleteAccountWarning")}</p>

            <div className="space-y-3">
              <div>
                <label className="label-stitch">{t("confirmPassword")}</label>
                <input
                  type="password"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  className="input-stitch placeholder:text-ink-muted/60"
                  placeholder={t("enterPasswordToDelete")}
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleDeleteAccount}
                  disabled={deleteLoading || !deletePassword}
                  className="flex-1 rounded-lg border border-red-300 bg-red-600 px-4 py-2 text-white hover:bg-red-700 disabled:opacity-50"
                >
                  {deleteLoading ? t("deleting") : t("confirmDelete")}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setDeletePassword("");
                    setDeleteError(null);
                  }}
                  className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-700 hover:bg-gray-50"
                >
                  {t("cancel")}
                </button>
              </div>
            </div>

            {deleteError && (
              <div className="mt-4 rounded-lg border border-red-300 bg-white p-3 text-red-700">
                {deleteError}
              </div>
            )}

            {deleteSuccess && (
              <div className="mt-4 rounded-lg border border-green-300 bg-green-50 p-3 text-green-700">
                {t("accountDeleted")}
              </div>
            )}
          </div>
        )}
      </section>

      {error && (
        <div className="mt-6 rounded-lg border border-red-300 bg-red-50 p-4 text-red-700">
          <p className="font-medium">{t("error")}</p>
          <p>{error}</p>
        </div>
      )}

    </div>
  );
}
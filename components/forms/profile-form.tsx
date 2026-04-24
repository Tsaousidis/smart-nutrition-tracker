"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { useCsrfToken } from "@/lib/useCsrfToken";
import { calculateMacroTargets } from "@/lib/calculations";

type ProfileFormData = {
  sex: "MALE" | "FEMALE";
  age: number;
  heightCm: number;
  weightKg: number;
  activityLevel: "SEDENTARY" | "LIGHT" | "MODERATE" | "VERY_ACTIVE" | "EXTRA_ACTIVE";
  goalType: "MAINTAIN" | "LOSE_WEIGHT" | "GAIN_MUSCLE";
};

const defaultFormData: ProfileFormData = {
  sex: "MALE",
  age: 27,
  heightCm: 180,
  weightKg: 82,
  activityLevel: "MODERATE",
  goalType: "LOSE_WEIGHT",
};

export default function ProfileForm() {
  const t = useTranslations("Onboarding");
  const { csrfToken } = useCsrfToken();

  const [formData, setFormData] = useState<ProfileFormData>(defaultFormData);
  const [loading, setLoading] = useState(false);
  const [responseData, setResponseData] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Account deletion state
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleteSuccess, setDeleteSuccess] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

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
        window.location.href = "/login";
      }, 2000);
    } catch (err) {
      console.error(err);
      setDeleteError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setDeleteLoading(false);
    }
  }

  // Load existing profile on mount
  useEffect(() => {
    async function loadProfile() {
      try {
        const res = await fetch("/api/profile");
        const data = await res.json();
        if (res.ok && data.ok && data.data?.profile) {
          setFormData({
            sex: data.data.profile.sex ?? defaultFormData.sex,
            age: data.data.profile.age ?? defaultFormData.age,
            heightCm: data.data.profile.heightCm ?? defaultFormData.heightCm,
            weightKg: data.data.profile.weightKg ?? defaultFormData.weightKg,
            activityLevel: data.data.profile.activityLevel ?? defaultFormData.activityLevel,
            goalType: data.data.goal?.goalType ?? defaultFormData.goalType,
          });
        }
      } catch (err) {
        console.error("Failed to load profile:", err);
      }
    }
    loadProfile();
  }, []);

  const calculatedTargets = useMemo(() => {
    return calculateMacroTargets(
      {
        age: formData.age,
        sex: formData.sex,
        heightCm: formData.heightCm,
        weightKg: formData.weightKg,
        activityLevel: formData.activityLevel,
      },
      formData.goalType
    );
  }, [formData.age, formData.sex, formData.heightCm, formData.weightKg, formData.activityLevel, formData.goalType]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "age" || name === "heightCm" || name === "weightKg" ? Number(value) : value,
    }));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResponseData(null);

    if (!csrfToken) {
      setError("Security error: CSRF token not available");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "x-csrf-token": csrfToken,
        },
        credentials: "include",
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to save profile");
      setResponseData(JSON.stringify(data, null, 2));
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl rounded-2xl border p-6 shadow-sm">
      <h1 className="mb-6 text-2xl font-bold">{t("title")}</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium">{t("sex")}</label>
          <select name="sex" value={formData.sex} onChange={handleChange} className="w-full rounded-lg border px-3 py-2">
            <option value="MALE">{t("male")}</option>
            <option value="FEMALE">{t("female")}</option>
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">{t("age")}</label>
          <input type="number" name="age" value={formData.age} onChange={handleChange} className="w-full rounded-lg border px-3 py-2" />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">{t("height")}</label>
          <input type="number" name="heightCm" value={formData.heightCm} onChange={handleChange} className="w-full rounded-lg border px-3 py-2" />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">{t("weight")}</label>
          <input type="number" name="weightKg" value={formData.weightKg} onChange={handleChange} className="w-full rounded-lg border px-3 py-2" />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">{t("activityLevel")}</label>
          <select name="activityLevel" value={formData.activityLevel} onChange={handleChange} className="w-full rounded-lg border px-3 py-2">
            <option value="SEDENTARY">{t("sedentary")}</option>
            <option value="LIGHT">{t("light")}</option>
            <option value="MODERATE">{t("moderate")}</option>
            <option value="VERY_ACTIVE">{t("veryActive")}</option>
            <option value="EXTRA_ACTIVE">{t("extraActive")}</option>
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">{t("goalType")}</label>
          <select name="goalType" value={formData.goalType} onChange={handleChange} className="w-full rounded-lg border px-3 py-2">
            <option value="MAINTAIN">{t("maintain")}</option>
            <option value="LOSE_WEIGHT">{t("loseWeightFat")}</option>
            <option value="GAIN_MUSCLE">{t("gainMuscle")}</option>
          </select>
        </div>

        <button type="submit" disabled={loading} className="w-full rounded-lg bg-black px-4 py-2 text-white disabled:opacity-50">
          {loading ? t("saving") : t("submit")}
        </button>
      </form>

      <section className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-5">
        <h2 className="mb-3 text-lg font-semibold">{t("currentTargetSummary")}</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl bg-white p-4 shadow-sm">
            <p className="text-sm text-slate-500">{t("dailyCalories")}</p>
            <p className="mt-2 text-2xl font-bold">{calculatedTargets.dailyCalories.toFixed(0)} kcal</p>
          </div>
          <div className="rounded-xl bg-white p-4 shadow-sm">
            <p className="text-sm text-slate-500">{t("dailyProtein")}</p>
            <p className="mt-2 text-2xl font-bold">{calculatedTargets.proteinTarget.toFixed(0)} g</p>
          </div>
          <div className="rounded-xl bg-white p-4 shadow-sm">
            <p className="text-sm text-slate-500">{t("dailyCarbs")}</p>
            <p className="mt-2 text-2xl font-bold">{calculatedTargets.carbsTarget.toFixed(0)} g</p>
          </div>
          <div className="rounded-xl bg-white p-4 shadow-sm">
            <p className="text-sm text-slate-500">{t("dailyFat")}</p>
            <p className="mt-2 text-2xl font-bold">{calculatedTargets.fatTarget.toFixed(0)} g</p>
          </div>
        </div>
      </section>

      {/* Account Deletion Section - at the bottom */}
      <section className="mt-8 rounded-2xl border border-red-200 bg-red-50 p-5">
        {!showDeleteConfirm ? (
          <>
            <h2 className="mb-3 text-lg font-semibold text-red-700">{t("deleteAccount")}</h2>
            <p className="mb-4 text-sm text-gray-600">{t("deleteAccountWarning")}</p>
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="w-full rounded-lg border border-red-300 bg-red-100 px-4 py-2 text-red-700 hover:bg-red-200"
            >
              {t("deleteAccountButton")}
            </button>
          </>
        ) : (
          <>
            <h2 className="mb-3 text-lg font-semibold text-red-700">{t("deleteAccount")}</h2>
            <p className="mb-4 text-sm text-gray-600">{t("deleteAccountWarning")}</p>
            
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-sm font-medium">{t("confirmPassword")}</label>
                <input
                  type="password"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  className="w-full rounded-lg border px-3 py-2"
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
          </>
        )}
      </section>

      {error && (
        <div className="mt-6 rounded-lg border border-red-300 bg-red-50 p-4 text-red-700">
          <p className="font-medium">{t("error")}</p>
          <p>{error}</p>
        </div>
      )}

      {responseData && (
        <div className="mt-6 rounded-lg border bg-gray-50 p-4">
          <p className="mb-2 font-medium">{t("apiResponse")}</p>
          <pre className="overflow-x-auto text-sm">
            {responseData}
          </pre>
        </div>
      )}
    </div>
  );
}
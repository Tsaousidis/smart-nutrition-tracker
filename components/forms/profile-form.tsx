"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

type ProfileFormData = {
  sex: "MALE" | "FEMALE";
  age: number;
  heightCm: number;
  weightKg: number;
  activityLevel: "SEDENTARY" | "LIGHT" | "MODERATE" | "VERY_ACTIVE" | "EXTRA_ACTIVE";
  goalType: "MAINTAIN" | "LOSE_WEIGHT" | "LOSE_FAT" | "GAIN_MUSCLE" | "RECOMP";
};

export default function ProfileForm() {
  const t = useTranslations("Onboarding");

  const [formData, setFormData] = useState<ProfileFormData>({
    sex: "MALE",
    age: 27,
    heightCm: 180,
    weightKg: 82,
    activityLevel: "MODERATE",
    goalType: "LOSE_FAT",
  });

  const [loading, setLoading] = useState(false);
  const [responseData, setResponseData] = useState<unknown>(null);
  const [error, setError] = useState<string | null>(null);

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

    try {
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to save profile");
      setResponseData(data);
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
            <option value="LOSE_WEIGHT">{t("loseWeight")}</option>
            <option value="LOSE_FAT">{t("loseFat")}</option>
            <option value="GAIN_MUSCLE">{t("gainMuscle")}</option>
            <option value="RECOMP">{t("recomp")}</option>
          </select>
        </div>

        <button type="submit" disabled={loading} className="w-full rounded-lg bg-black px-4 py-2 text-white disabled:opacity-50">
          {loading ? t("saving") : t("submit")}
        </button>
      </form>

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
            {JSON.stringify(responseData, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
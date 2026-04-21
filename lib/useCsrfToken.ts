import { useEffect, useState } from "react";

export function useCsrfToken() {
  const [csrfToken, setCsrfToken] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchToken = async () => {
      try {
        const response = await fetch("/api/csrf", {
          method: "GET",
          credentials: "include", // Include cookies
        });

        if (!response.ok) {
          throw new Error("Failed to fetch CSRF token");
        }

        const data = await response.json();
        setCsrfToken(data.csrfToken);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    };

    fetchToken();
  }, []);

  return { csrfToken, loading, error };
}

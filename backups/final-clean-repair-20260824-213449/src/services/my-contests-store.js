const KEY = "batzo_my_contests";

export function getMyContests() {
  try {
    return JSON.parse(
      localStorage.getItem(KEY) || "[]"
    );
  } catch {
    return [];
  }
}

export function subscribeMyContests(callback) {
  const handler = () => {
    callback(getMyContests());
  };

  window.addEventListener(
    "batzo:contest-joined",
    handler
  );

  window.addEventListener(
    "storage",
    handler
  );

  return () => {
    window.removeEventListener(
      "batzo:contest-joined",
      handler
    );

    window.removeEventListener(
      "storage",
      handler
    );
  };
}

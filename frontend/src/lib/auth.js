export const ROLES = {
  PUBLIC: "public",
  RESEARCHER: "researcher",
};

export const ROLE_LABELS = {
  [ROLES.PUBLIC]: "Pengguna Umum",
  [ROLES.RESEARCHER]: "Peneliti",
};

export const RESEARCHER_DUMMY_ACCOUNT = {
  username: "peneliti",
  password: "peneliti123",
  user: {
    id: "researcher-demo",
    name: "Peneliti EMSys",
    role: ROLES.RESEARCHER,
  },
};

export const AUTH_STORAGE_KEY = "emsys:auth-user";

const ROLE_PERMISSIONS = {
  [ROLES.PUBLIC]: {
    canAccessDashboard: true,
    canViewLatestData: true,
    canViewMonitoringChart: true,
    canToggleTheme: true,
    canExportData: true,
    canAccessAnalytics: false,
    canAccessHistory: false,
    canFilterHistory: false,
    canDeleteData: false,
    canManageDummyData: false,
  },
  [ROLES.RESEARCHER]: {
    canAccessDashboard: true,
    canViewLatestData: true,
    canViewMonitoringChart: true,
    canToggleTheme: true,
    canExportData: true,
    canAccessAnalytics: true,
    canAccessHistory: true,
    canFilterHistory: true,
    canDeleteData: true,
    canManageDummyData: true,
  },
};

export function getRoleFromUser(user) {
  return user?.role === ROLES.RESEARCHER ? ROLES.RESEARCHER : ROLES.PUBLIC;
}

export function getRoleLabel(role) {
  return ROLE_LABELS[role] ?? ROLE_LABELS[ROLES.PUBLIC];
}

export function getPermissionsForRole(role) {
  return ROLE_PERMISSIONS[role] ?? ROLE_PERMISSIONS[ROLES.PUBLIC];
}

export function readStoredUser() {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    return parsed?.role === ROLES.RESEARCHER ? parsed : null;
  } catch {
    return null;
  }
}

export function persistUser(user) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
}

export function clearStoredUser() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(AUTH_STORAGE_KEY);
}

export function authenticateResearcher({ username, password }) {
  const normalizedUsername = String(username ?? "").trim().toLowerCase();
  const normalizedPassword = String(password ?? "");

  if (
    normalizedUsername === RESEARCHER_DUMMY_ACCOUNT.username &&
    normalizedPassword === RESEARCHER_DUMMY_ACCOUNT.password
  ) {
    return {
      ok: true,
      user: {
        ...RESEARCHER_DUMMY_ACCOUNT.user,
        loggedInAt: new Date().toISOString(),
      },
    };
  }

  return {
    ok: false,
    error: "Username atau password peneliti tidak sesuai.",
  };
}

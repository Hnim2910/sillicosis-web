import { createMockDatabase } from "@/data/mockData";
import type { MockDatabase } from "@/types/database";
import type { Role, User } from "@/types/user";

const DATABASE_KEY = "silicosis-demo-v1";
const SESSION_KEY = "silicosis-session-v1";
export const delay = (milliseconds = 250) =>
  new Promise<void>((resolve) => setTimeout(resolve, milliseconds));

export function readDatabase(): MockDatabase {
  const saved = localStorage.getItem(DATABASE_KEY);
  if (!saved) {
    const database = createMockDatabase();
    writeDatabase(database);
    return database;
  }
  try {
    const database = JSON.parse(saved) as MockDatabase;
    if (
      database.version !== 1 ||
      !Array.isArray(database.users) ||
      !Array.isArray(database.patients) ||
      !Array.isArray(database.predictions) ||
      !database.passwords
    )
      throw new Error();
    return database;
  } catch {
    throw new Error(
      "Dữ liệu demo trong trình duyệt bị lỗi. Hãy xóa dữ liệu trang web rồi đăng nhập lại.",
    );
  }
}

export function writeDatabase(database: MockDatabase) {
  try {
    localStorage.setItem(DATABASE_KEY, JSON.stringify(database));
  } catch {
    throw new Error(
      "Không thể lưu dữ liệu demo. Bộ nhớ trình duyệt có thể đã đầy hoặc bị chặn; hãy dùng ảnh nhỏ hơn.",
    );
  }
}

export function setSession(userId: string | null) {
  if (userId) sessionStorage.setItem(SESSION_KEY, userId);
  else sessionStorage.removeItem(SESSION_KEY);
  window.dispatchEvent(new Event("silicosis-session"));
}

export function currentUser(database = readDatabase()): User | null {
  const user = database.users.find((entry) => entry.id === sessionStorage.getItem(SESSION_KEY));
  return user?.active ? user : null;
}

export function requireUser(database: MockDatabase, roles?: Role[]) {
  const user = currentUser(database);
  if (!user) throw new Error("Phiên đăng nhập không còn hợp lệ. Vui lòng đăng nhập lại.");
  if (roles && !roles.includes(user.role))
    throw new Error("Bạn không có quyền thực hiện thao tác này.");
  return user;
}

export function requirePatientAccess(database: MockDatabase, patientId: string) {
  const user = requireUser(database);
  if (user.role === "patient" && user.patientId !== patientId)
    throw new Error("Bạn chỉ có thể xem hồ sơ và kết quả của mình.");
  if (!database.patients.some((patient) => patient.id === patientId))
    throw new Error("Không tìm thấy hồ sơ bệnh nhân.");
  return user;
}

export function createId(prefix: string) {
  return `${prefix}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
}

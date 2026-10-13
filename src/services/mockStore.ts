import { createMockDatabase } from "@/data/mockData";
import type { MockDatabase } from "@/types/database";
import type { Role, User } from "@/types/user";
import { getSessionUser } from "@/services/authService";

const DATABASE_KEY = "silicosis-demo-v1";
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
      !Array.isArray(database.predictions)
    )
      throw new Error();
    // Sign-in moved to the backend; drop the passwords older demo data still carries.
    if ("passwords" in database) {
      delete (database as { passwords?: unknown }).passwords;
      writeDatabase(database);
    }
    // Remove retired roles without resetting patients, predictions or surviving accounts.
    const removedUsers = database.users.filter(user => user.role !== "patient" && user.role !== "admin");
    if (removedUsers.length) {
      const removedIds = new Set(removedUsers.map(user => user.id));
      database.users = database.users.filter(user => !removedIds.has(user.id));
      writeDatabase(database);
    }
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

// Sign-in now goes through the backend; mock features check roles against the backend user.
// Backend patients have no patientId yet, so patient-only mock data stays empty for them.
export function currentUser(): User | null {
  const user = getSessionUser();
  return user?.active ? user : null;
}

export function requireUser(database: MockDatabase, roles?: Role[]) {
  const user = currentUser();
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

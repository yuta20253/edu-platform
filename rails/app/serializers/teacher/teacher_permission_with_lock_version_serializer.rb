# frozen_string_literal: true

module Teacher
  # 権限管理の画面だけで使う。保存時の楽観ロックに使うlock_versionを足して返す。
  # TeacherPermissionSerializerは/meなどと共有しているので、そちらには足さない
  class TeacherPermissionWithLockVersionSerializer < ::TeacherPermissionSerializer
    attributes :lock_version
  end
end

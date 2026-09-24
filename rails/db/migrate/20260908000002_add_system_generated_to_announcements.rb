# frozen_string_literal: true

class AddSystemGeneratedToAnnouncements < ActiveRecord::Migration[7.2]
  # 面談確定/申請/キャンセルなどシステムが自動生成する通知をAnnouncementとして
  # 保存する際、publisher_idに通知の当事者(教員 or 生徒)を設定している。
  # publisher_idは「教員が自分で作成したお知らせ」タブの判定にも使われるため、
  # このフラグで両者を区別できるようにする。
  def change
    add_column :announcements, :system_generated, :boolean, default: false, null: false
  end
end

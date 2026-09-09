# frozen_string_literal: true

module Teacher
  # 承認/却下/申請発生などシステムが自動生成する通知用。下書きを経由せず即座に公開する。
  class CreateSystemAnnouncementService < Common::AnnouncementCreateService
    private

    def initial_status
      :published
    end
  end
end

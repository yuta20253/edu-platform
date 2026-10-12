# frozen_string_literal: true

module Teacher
  # 教員が作成するお知らせは自校内にのみ配信する。
  class CreateAnnouncementService < Common::AnnouncementCreateService
    private

    def school_scoped?
      true
    end
  end
end

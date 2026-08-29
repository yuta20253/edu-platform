# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Teacher::CreateSystemAnnouncementService do
  subject(:service) do
    described_class.new(
      publisher: teacher,
      title: 'テストタイトル',
      content: 'テスト内容',
      announcement_targets: [{ 'target_type' => 'by_user', 'user_id' => teacher.id }]
    )
  end

  let!(:high_school) { create(:high_school) }
  let!(:teacher) { create(:user, :teacher, high_school: high_school) }

  describe '#call' do
    it 'publishedでannouncementが作成される' do
      service.call

      expect(Announcement.last.status).to eq('published')
    end

    it 'published_atが保存される' do
      service.call

      expect(Announcement.last.published_at).to be_present
    end

    it '対象ユーザーから見える' do
      service.call

      expect(Announcement.for_user(teacher).published).to include(Announcement.last)
    end
  end
end

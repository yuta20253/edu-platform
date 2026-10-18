# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Teacher::UpdateAnnouncementService do
  subject(:service) do
    described_class.new(
      announcement: announcement,
      title: '更新後タイトル',
      content: '更新後本文',
      announcement_targets: [{ 'target_type' => 'all_users' }],
      delivery: { status: 'scheduled', scheduled_at: 1.day.from_now }
    )
  end

  let(:teacher) { create(:user, :teacher) }
  let!(:announcement) { create(:announcement, :scheduled, publisher: teacher, title: '更新前タイトル') }
  let!(:old_target) do
    create(:announcement_target, announcement: announcement, target_type: :by_school,
                                 high_school_id: teacher.high_school_id)
  end

  describe '#call' do
    context '読み込んだ後に予約配信ジョブによって配信済みになっていた場合' do
      before do
        # serviceに渡すannouncementは予約投稿のまま、DB上だけ配信済みにする
        Announcement.find(announcement.id).update!(status: :published)
      end

      it 'RecordInvalidが発生する' do
        expect { service.call }.to raise_error(ActiveRecord::RecordInvalid)
      end

      it 'お知らせの内容と配信先は変わらない' do
        expect { service.call }.to raise_error(ActiveRecord::RecordInvalid)

        reloaded = Announcement.find(announcement.id)
        expect(reloaded.title).to eq('更新前タイトル')
        expect(reloaded.announcement_targets.pluck(:id)).to eq([old_target.id])
      end
    end
  end
end

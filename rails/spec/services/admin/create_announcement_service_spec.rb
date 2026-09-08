# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Admin::CreateAnnouncementService do
  subject(:service) do
    described_class.new(
      publisher: admin,
      title: 'システムメンテナンスのお知らせ',
      content: 'メンテナンスを実施します。',
      status: status,
      scheduled_at: scheduled_at
    )
  end

  let(:admin) { create(:user, :admin, high_school: nil) }
  let(:status) { :draft }
  let(:scheduled_at) { nil }

  describe '#call' do
    it 'announcementが作成される' do
      expect { service.call }.to change(Announcement, :count).by(1)
    end

    it 'publisherが指定した管理者になる' do
      service.call
      expect(Announcement.last.publisher).to eq(admin)
    end

    it 'target_type: all_usersのannouncement_targetが1件だけ作成される' do
      service.call

      targets = Announcement.last.announcement_targets
      expect(targets.count).to eq(1)
      expect(targets.first.target_type).to eq('all_users')
    end

    it 'target_typeを受け取るパラメータを持たない' do
      expect(described_class.instance_method(:initialize).parameters.map(&:last))
        .not_to include(:announcement_targets)
    end

    context 'status: :scheduledの場合' do
      let(:status) { :scheduled }
      let(:scheduled_at) { 1.day.from_now }

      it 'scheduledで作成される' do
        service.call
        expect(Announcement.last.status).to eq('scheduled')
      end

      it 'scheduled_atが保存される' do
        service.call
        expect(Announcement.last.scheduled_at).to be_within(1.second).of(scheduled_at)
      end
    end

    context 'status: :publishedの場合' do
      let(:status) { :published }

      it 'publishedで作成される' do
        service.call
        expect(Announcement.last.status).to eq('published')
      end

      it '生徒・教師から見える(for_userにマッチする)' do
        student = create(:user)
        service.call
        expect(Announcement.for_user(student).published).to include(Announcement.last)
      end
    end

    context 'status: :scheduledでscheduled_atが過去日時の場合' do
      let(:status) { :scheduled }
      let(:scheduled_at) { 1.day.ago }

      it 'RecordInvalidが発生する' do
        expect { service.call }.to raise_error(ActiveRecord::RecordInvalid)
      end
    end
  end
end

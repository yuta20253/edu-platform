# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Admin::AnnouncementPublisher do
  subject(:publisher) { described_class.new(announcement) }

  let(:admin) { create(:user, :admin, high_school: nil) }

  describe '#call' do
    context 'draftのお知らせの場合' do
      let(:announcement) { create(:announcement, publisher: admin, status: :draft) }

      it 'publishedになる' do
        publisher.call
        expect(announcement.reload.status).to eq('published')
      end

      it 'published_atが設定される' do
        publisher.call
        expect(announcement.reload.published_at).to be_present
      end

      it 'trueを返す' do
        expect(publisher.call).to be true
      end

      it '生徒・教師から見える(for_userにマッチする)' do
        student = create(:user)
        create(:announcement_target, :all_users, announcement: announcement)
        publisher.call
        expect(Announcement.for_user(student).published).to include(announcement)
      end
    end

    context 'scheduledのお知らせの場合' do
      let(:announcement) { create(:announcement, :scheduled, publisher: admin) }

      it 'publishedになる' do
        publisher.call
        expect(announcement.reload.status).to eq('published')
      end

      it 'scheduled_atがクリアされる' do
        publisher.call
        expect(announcement.reload.scheduled_at).to be_nil
      end
    end

    context 'すでにpublishedのお知らせの場合' do
      let(:announcement) { create(:announcement, publisher: admin, status: :published) }

      it 'falseを返す' do
        expect(publisher.call).to be false
      end

      it 'エラーメッセージが設定される' do
        publisher.call
        expect(announcement.errors[:status]).to be_present
      end

      it 'statusは変わらない' do
        publisher.call
        expect(announcement.reload.status).to eq('published')
      end
    end
  end
end

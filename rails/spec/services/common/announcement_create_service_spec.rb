# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Common::AnnouncementCreateService do
  subject(:service) do
    described_class.new(
      publisher: publisher,
      title: 'テストタイトル',
      content: 'テスト内容',
      announcement_targets: [{ 'target_type' => 'all_users' }],
      delivery: delivery
    )
  end

  let(:publisher) { create(:user, :admin) }
  let(:delivery) { {} }

  describe '#call' do
    context 'deliveryを指定しない場合' do
      it 'draftで作成される（initial_statusのデフォルト）' do
        service.call

        expect(Announcement.last.status).to eq('draft')
      end
    end

    context 'status: :scheduledとscheduled_atを指定した場合' do
      let(:delivery) { { status: :scheduled, scheduled_at: 1.day.from_now } }

      it 'scheduledで作成される' do
        service.call

        expect(Announcement.last.status).to eq('scheduled')
      end

      it 'scheduled_atが保存される' do
        service.call

        expect(Announcement.last.scheduled_at).to be_within(1.second).of(delivery[:scheduled_at])
      end
    end

    context 'status: :publishedを指定した場合' do
      let(:delivery) { { status: :published } }

      it 'publishedで作成される' do
        service.call

        expect(Announcement.last.status).to eq('published')
      end

      it 'published_atが自動設定される' do
        service.call

        expect(Announcement.last.published_at).to be_present
      end
    end

    it 'announcement_targetがall_usersとして作成される' do
      service.call

      target = AnnouncementTarget.last
      expect(target.target_type).to eq('all_users')
    end

    context 'target_typeが不正な場合' do
      subject(:service) do
        described_class.new(
          publisher: publisher,
          title: 'テストタイトル',
          content: 'テスト内容',
          announcement_targets: [{ 'target_type' => 'invalid' }]
        )
      end

      it 'RecordInvalidが発生しトランザクションがロールバックされる' do
        expect { service.call }.to raise_error(ActiveRecord::RecordInvalid)
        expect(Announcement.count).to eq(0)
      end
    end
  end
end

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

    context 'target_type別のannouncement_target属性' do
      subject(:service) do
        described_class.new(
          publisher: publisher,
          title: 'テストタイトル',
          content: 'テスト内容',
          announcement_targets: announcement_targets
        )
      end

      let!(:high_school) { create(:high_school) }
      let(:publisher) { create(:user, :teacher, high_school: high_school) }

      context 'target_type: by_role' do
        let(:announcement_targets) do
          [{ 'target_type' => 'by_role', 'user_role_id' => publisher.user_role_id }]
        end

        it 'user_role_idが保存される' do
          service.call

          target = AnnouncementTarget.last
          expect(target.target_type).to eq('by_role')
          expect(target.user_role_id).to eq(publisher.user_role_id)
        end
      end

      context 'target_type: by_grade' do
        let(:announcement_targets) do
          [{ 'target_type' => 'by_grade', 'grade_id' => publisher.grade_id, 'user_role_id' => publisher.user_role_id }]
        end

        it 'grade_idとuser_role_idが保存される' do
          service.call

          target = AnnouncementTarget.last
          expect(target.target_type).to eq('by_grade')
          expect(target.grade_id).to eq(publisher.grade_id)
          expect(target.user_role_id).to eq(publisher.user_role_id)
        end
      end

      context 'target_type: by_school' do
        let(:announcement_targets) { [{ 'target_type' => 'by_school' }] }

        it 'high_school_idが保存される' do
          service.call

          target = AnnouncementTarget.last
          expect(target.target_type).to eq('by_school')
          expect(target.high_school_id).to eq(publisher.high_school_id)
        end
      end

      context 'target_type: by_user' do
        let(:announcement_targets) { [{ 'target_type' => 'by_user', 'user_id' => publisher.id }] }

        it 'user_idが保存される' do
          service.call

          target = AnnouncementTarget.last
          expect(target.target_type).to eq('by_user')
          expect(target.user_id).to eq(publisher.id)
        end
      end

      context '複数target_type' do
        let(:announcement_targets) do
          [
            { 'target_type' => 'by_school' },
            { 'target_type' => 'by_role', 'user_role_id' => publisher.user_role_id }
          ]
        end

        it '複数のannouncement_targetが作成される' do
          expect { service.call }.to change(AnnouncementTarget, :count).by(2)
        end
      end
    end
  end
end

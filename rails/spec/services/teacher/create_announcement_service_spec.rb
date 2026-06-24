# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Teacher::CreateAnnouncementService do
  subject(:service) { described_class.new(form) }

  let!(:high_school) { create(:high_school) }

  let!(:teacher) do
    create(
      :user,
      :teacher,
      high_school: high_school
    )
  end

  let(:form) do
    Teacher::CreateAnnouncementForm.new(
      current_user: teacher,
      title: 'テストタイトル',
      content: 'テスト内容',
      announcement_targets: announcement_targets
    )
  end

  describe '#call' do
    context 'target_type: all_users' do
      let(:announcement_targets) do
        [
          {
            'target_type' => 'all_users'
          }
        ]
      end

      it 'announcementが作成される' do
        expect do
          service.call
        end.to change(Announcement, :count).by(1)
      end

      it 'announcement_targetが作成される' do
        expect do
          service.call
        end.to change(AnnouncementTarget, :count).by(1)
      end

      it 'all_usersで保存される' do
        service.call

        target = AnnouncementTarget.last

        expect(target.target_type).to eq('all_users')
      end
    end

    context 'target_type: by_role' do
      let(:announcement_targets) do
        [
          {
            'target_type' => 'by_role',
            'user_role_id' => teacher.user_role_id
          }
        ]
      end

      it 'user_role_idが保存される' do
        service.call

        target = AnnouncementTarget.last

        expect(target.target_type).to eq('by_role')
        expect(target.user_role_id).to eq(teacher.user_role_id)
      end
    end

    context 'target_type: by_grade' do
      let(:announcement_targets) do
        [
          {
            'target_type' => 'by_grade',
            'grade_id' => teacher.grade_id,
            'user_role_id' => teacher.user_role_id
          }
        ]
      end

      it 'grade_idとuser_role_idが保存される' do
        service.call

        target = AnnouncementTarget.last

        expect(target.target_type).to eq('by_grade')
        expect(target.grade_id).to eq(teacher.grade_id)
        expect(target.user_role_id).to eq(teacher.user_role_id)
      end
    end

    context 'target_type: by_school' do
      let(:announcement_targets) do
        [
          {
            'target_type' => 'by_school'
          }
        ]
      end

      it 'high_school_idが保存される' do
        service.call

        target = AnnouncementTarget.last

        expect(target.target_type).to eq('by_school')
        expect(target.high_school_id).to eq(teacher.high_school_id)
      end
    end

    context 'target_type: by_user' do
      let(:announcement_targets) do
        [
          {
            'target_type' => 'by_user',
            'user_id' => teacher.id
          }
        ]
      end

      it 'user_idが保存される' do
        service.call

        target = AnnouncementTarget.last

        expect(target.target_type).to eq('by_user')
        expect(target.user_id).to eq(teacher.id)
      end
    end

    context '複数target_type' do
      let(:announcement_targets) do
        [
          {
            'target_type' => 'by_school'
          },
          {
            'target_type' => 'by_role',
            'user_role_id' => teacher.user_role_id
          }
        ]
      end

      it '複数のannouncement_targetが作成される' do
        expect do
          service.call
        end.to change(AnnouncementTarget, :count).by(2)
      end
    end

    context 'target_typeが不正な場合' do
      let(:announcement_targets) do
        [
          {
            'target_type' => 'invalid'
          }
        ]
      end

      it 'RecordInvalidが発生する' do
        expect do
          service.call
        end.to raise_error(ActiveRecord::RecordInvalid)
      end

      it 'transactionがロールバックされる' do
        expect { service.call }.to raise_error(ActiveRecord::RecordInvalid)
        expect(Announcement.count).to eq(0)
      end
    end
  end
end

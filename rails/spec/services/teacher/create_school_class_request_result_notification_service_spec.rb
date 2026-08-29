# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Teacher::CreateSchoolClassRequestResultNotificationService do
  subject(:service) do
    described_class.new(school_class_request: school_class_request, approver: approver)
  end

  let!(:high_school) { create(:high_school) }
  let!(:grade) { create(:grade, high_school: high_school) }
  let!(:applicant) { create(:user, :teacher, high_school: high_school) }
  let!(:approver) { create(:user, :teacher, high_school: high_school) }

  describe '#call' do
    context '承認された場合' do
      let!(:school_class_request) do
        create(
          :school_class_request,
          applicant: applicant,
          grade: grade,
          action: :creation,
          status: :approved,
          name: '1組'
        )
      end

      it 'publishedなannouncementが作成される' do
        service.call

        expect(Announcement.last.status).to eq('published')
      end

      it '承認メッセージのタイトルで作成される' do
        service.call

        expect(Announcement.last.title).to eq('クラス作成申請が承認されました')
      end

      it '申請者宛に作成される' do
        service.call

        expect(Announcement.for_user(applicant).published).to include(Announcement.last)
      end
    end

    context '却下された場合(理由あり)' do
      let!(:school_class_request) do
        create(
          :school_class_request,
          applicant: applicant,
          grade: grade,
          action: :creation,
          status: :rejected,
          name: '1組',
          reason: '既に同名のクラスが存在するため'
        )
      end

      it '却下メッセージのタイトルで作成される' do
        service.call

        expect(Announcement.last.title).to eq('クラス作成申請が却下されました')
      end

      it '理由が本文に含まれる' do
        service.call

        expect(Announcement.last.content).to include('既に同名のクラスが存在するため')
      end
    end

    context '却下された場合(理由なし)' do
      let!(:school_class_request) do
        create(
          :school_class_request,
          applicant: applicant,
          grade: grade,
          action: :creation,
          status: :rejected,
          name: '1組',
          reason: nil
        )
      end

      it '理由の記載なしで作成される' do
        service.call

        expect(Announcement.last.content).to eq('クラス作成の申請が却下されました。')
      end
    end

    context 'action=modificationの場合' do
      let!(:target_school_class) { create(:school_class, grade: grade) }
      let!(:school_class_request) do
        create(
          :school_class_request,
          applicant: applicant,
          grade: grade,
          school_class: target_school_class,
          action: :modification,
          status: :approved,
          name: '2組'
        )
      end

      it 'クラス変更のタイトルで作成される' do
        service.call

        expect(Announcement.last.title).to eq('クラス変更申請が承認されました')
      end
    end

    context 'action=deletionの場合' do
      let!(:target_school_class) { create(:school_class, grade: grade) }
      let!(:school_class_request) do
        create(
          :school_class_request,
          applicant: applicant,
          grade: grade,
          school_class: target_school_class,
          action: :deletion,
          status: :approved,
          name: nil
        )
      end

      it 'クラス削除のタイトルで作成される' do
        service.call

        expect(Announcement.last.title).to eq('クラス削除申請が承認されました')
      end
    end
  end
end

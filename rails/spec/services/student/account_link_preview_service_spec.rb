# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Student::AccountLinkPreviewService, type: :service do
  subject(:call) { described_class.new(user: user, student_number: student_number).call }

  let(:user) { create(:user, :student) }

  describe '#call' do
    context '未利用の仮Userが存在する場合' do
      let!(:target_user) do
        create(:user, :student, :invitation_pending, :with_school_class,
               student_number: 'AB12-CD3456', high_school: user.high_school)
      end
      let(:student_number) { target_user.student_number }

      it '対象Userの学校・学年・学級名を返す(氏名は含まない)' do
        result = call

        expect(result).to eq(
          high_school_name: target_user.high_school.name,
          grade_display_name: target_user.grade.display_name,
          school_class_name: target_user.school_class.name
        )
      end

      it '何も更新・削除しない' do
        expect { call }.not_to(change { target_user.reload.deleted_at })
        expect(User.exists?(target_user.id)).to be(true)
        expect(target_user.student_number).to eq('AB12-CD3456')
      end

      it '監査ログを作成しない' do
        call

        expect(AccountLinkAudit.count).to eq(0)
      end
    end

    context '対象Userに学級が未設定の場合' do
      let!(:target_user) do
        create(:user, :student, :invitation_pending,
               student_number: 'NOCLASS-01', high_school: user.high_school)
      end
      let(:student_number) { 'NOCLASS-01' }

      it 'school_class_nameはnilを返す' do
        result = call

        expect(result[:school_class_name]).to be_nil
      end
    end

    context 'ログイン中Userが既に別のstudent_numberで紐付け済みの場合' do
      let(:user) { create(:user, :student, student_number: 'ALREADY-000001') }
      let!(:target_user) do
        create(:user, :student, :invitation_pending, :with_school_class,
               student_number: 'NEWTARGET-01', high_school: user.high_school)
      end
      let(:student_number) { 'NEWTARGET-01' }

      it 'AlreadyLinkedErrorが発生する' do
        expect { call }.to raise_error(Student::AccountLinkService::AlreadyLinkedError)
      end
    end

    context '存在しないstudent_numberを指定した場合' do
      let(:student_number) { 'ZZ99-NOTFOUND1' }

      it 'RecordNotFoundが発生する' do
        expect { call }.to raise_error(ActiveRecord::RecordNotFound)
      end
    end

    context '既に有効化済みのUserのstudent_numberを指定した場合' do
      let!(:target_user) do
        create(:user, :student, :invitation_completed, :with_school_class, student_number: 'ACT-000001')
      end
      let(:student_number) { 'ACT-000001' }

      it 'AlreadyActivatedErrorが発生する' do
        expect { call }.to raise_error(Student::AccountLinkService::AlreadyActivatedError)
      end
    end

    context 'student_numberの学校がログイン中Userの学校と異なる場合' do
      let!(:target_user) do
        create(:user, :student, :invitation_pending, :with_school_class, student_number: 'SCH-000001')
      end
      let(:student_number) { 'SCH-000001' }

      it 'SchoolMismatchErrorが発生する' do
        expect { call }.to raise_error(Student::AccountLinkService::SchoolMismatchError)
      end
    end

    context '仮Userに関連データ(学習履歴)が存在する場合' do
      let!(:target_user) do
        create(:user, :student, :invitation_pending, :with_school_class,
               student_number: 'DEP-000001', high_school: user.high_school)
      end
      let(:student_number) { 'DEP-000001' }

      before { create(:study_log, user: target_user, task: create(:task, user: target_user)) }

      it 'HasDependentDataErrorが発生する' do
        expect { call }.to raise_error(Student::AccountLinkService::HasDependentDataError)
      end
    end
  end
end

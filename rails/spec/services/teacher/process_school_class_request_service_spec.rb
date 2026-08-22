# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Teacher::ProcessSchoolClassRequestService do
  subject(:service) do
    described_class.new(
      user: approver,
      id: school_class_request.id,
      status: status,
      lock_version: lock_version
    )
  end

  let!(:high_school) { create(:high_school) }
  let!(:grade) { create(:grade, high_school: high_school) }
  let!(:applicant) { create(:user, :teacher, high_school: high_school) }
  let!(:approver) { create(:user, :teacher, high_school: high_school) }

  let!(:school_class_request) do
    create(
      :school_class_request,
      applicant: applicant,
      grade: grade,
      action: :creation,
      status: :pending,
      name: '1組'
    )
  end

  let(:lock_version) { school_class_request.lock_version }

  describe '#call' do
    context '承認する場合' do
      let(:status) { 'approved' }

      it '真を返す' do
        expect(service.call).to be_truthy
      end

      it 'ステータスがapprovedになる' do
        service.call

        expect(school_class_request.reload.status).to eq('approved')
      end

      it 'approverが保存される' do
        service.call

        expect(school_class_request.reload.approver).to eq(approver)
      end

      it 'approved_atが保存される' do
        service.call

        expect(school_class_request.reload.approved_at).to be_present
      end

      it 'action=creationの場合、SchoolClassが作成される' do
        expect { service.call }.to change(SchoolClass, :count).by(1)

        created = SchoolClass.last
        expect(created.grade_id).to eq(school_class_request.grade_id)
        expect(created.name).to eq(school_class_request.name)
      end

      context 'action=modificationの場合' do
        let!(:target_school_class) { create(:school_class, grade: grade, name: '旧2組') }

        let!(:school_class_request) do
          create(
            :school_class_request,
            applicant: applicant,
            grade: grade,
            school_class: target_school_class,
            action: :modification,
            status: :pending,
            name: '2組'
          )
        end

        it 'SchoolClassのnameが更新される' do
          service.call

          expect(target_school_class.reload.name).to eq('2組')
        end

        it 'SchoolClassが新規作成されない' do
          expect { service.call }.not_to change(SchoolClass, :count)
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
            status: :pending,
            name: nil
          )
        end

        it 'SchoolClassが削除される' do
          expect { service.call }.to change(SchoolClass, :count).by(-1)
          expect(SchoolClass.exists?(target_school_class.id)).to be false
        end
      end
    end

    context '却下する場合' do
      let(:status) { 'rejected' }

      it '偽を返す' do
        expect(service.call).to be_falsy
      end

      it 'ステータスがrejectedになる' do
        service.call

        expect(school_class_request.reload.status).to eq('rejected')
      end

      it 'approved_atが保存されない' do
        service.call

        expect(school_class_request.reload.approved_at).to be_nil
      end

      it 'SchoolClassが作成されない' do
        expect { service.call }.not_to change(SchoolClass, :count)
      end
    end

    context '申請がpendingではない場合' do
      let(:status) { 'approved' }

      before do
        school_class_request.update!(status: :approved)
      end

      it 'falseを返す' do
        expect(service.call).to be false
      end

      it '更新されない' do
        expect { service.call }.not_to(change { school_class_request.reload.updated_at })
      end
    end

    context 'lock_versionが古い場合' do
      let(:status) { 'approved' }
      let(:lock_version) { 0 }

      before do
        school_class_request.update_column(
          :lock_version,
          school_class_request.lock_version + 1
        )
      end

      it 'StaleObjectErrorが発生する' do
        expect { service.call }.to raise_error(ActiveRecord::StaleObjectError)
      end
    end

    context 'statusに不正な値が指定された場合' do
      let(:status) { 'invalid_status' }

      it 'ArgumentErrorが発生する' do
        expect { service.call }.to raise_error(ArgumentError)
      end

      it '申請が更新されない' do
        expect do
          service.call
        rescue ArgumentError
          nil
        end.not_to(change { school_class_request.reload.status })
      end
    end

    context '申請者本人が承認しようとした場合' do
      subject(:service) do
        described_class.new(
          user: applicant,
          id: school_class_request.id,
          status: status,
          lock_version: lock_version
        )
      end

      let(:status) { 'approved' }

      it 'ApplicantCannotProcessOwnRequestErrorが発生する' do
        expect { service.call }.to raise_error(
          Teacher::ProcessSchoolClassRequestService::ApplicantCannotProcessOwnRequestError
        )
      end

      it '申請が更新されない' do
        expect do
          service.call
        rescue Teacher::ProcessSchoolClassRequestService::ApplicantCannotProcessOwnRequestError
          nil
        end.not_to(change { school_class_request.reload.status })
      end
    end

    context '他高校の申請の場合' do
      subject(:service) do
        described_class.new(
          user: other_approver,
          id: school_class_request.id,
          status: status,
          lock_version: lock_version
        )
      end

      let(:status) { 'approved' }
      let!(:other_high_school) { create(:high_school) }
      let!(:other_approver) { create(:user, :teacher, high_school: other_high_school) }

      it 'RecordNotFoundが発生する' do
        expect { service.call }.to raise_error(ActiveRecord::RecordNotFound)
      end
    end
  end
end

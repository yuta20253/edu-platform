# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Teacher::CreateSchoolClassRequestService do
  include ActiveJob::TestHelper

  subject(:service) { described_class.new(user: teacher, attributes: attributes) }

  let!(:high_school) { create(:high_school) }
  let!(:teacher) { create(:user, :teacher, high_school: high_school) }
  let!(:grade) { create(:grade, high_school: high_school) }

  let(:attributes) do
    {
      'name' => '1組',
      'grade_id' => grade.id,
      'action' => 'creation',
      'school_class_id' => nil
    }
  end

  describe '#call' do
    it 'SchoolClassRequestが作成される' do
      expect { service.call }.to change(SchoolClassRequest, :count).by(1)
    end

    it '入力内容で作成される' do
      service.call

      school_class_request = SchoolClassRequest.last

      expect(school_class_request.applicant).to eq(teacher)
      expect(school_class_request.grade_id).to eq(grade.id)
      expect(school_class_request.name).to eq('1組')
      expect(school_class_request.action).to eq('creation')
      expect(school_class_request.status).to eq('pending')
    end

    it '通知ジョブがキューに積まれる' do
      expect do
        service.call
      end.to have_enqueued_job(Teacher::CreateSchoolClassRequestNotificationJob)
        .with(user_id: teacher.id)
    end

    context 'actionがmodificationの場合' do
      let!(:school_class) { create(:school_class, grade: grade) }
      let(:attributes) do
        {
          'name' => '2組',
          'grade_id' => grade.id,
          'action' => 'modification',
          'school_class_id' => school_class.id
        }
      end

      it 'action=modificationで、指定したschool_class_idとともに作成される' do
        service.call

        school_class_request = SchoolClassRequest.last

        expect(school_class_request.action).to eq('modification')
        expect(school_class_request.school_class_id).to eq(school_class.id)
      end
    end

    context 'actionがdeletionの場合' do
      let!(:school_class) { create(:school_class, grade: grade) }
      let(:attributes) do
        {
          'name' => nil,
          'grade_id' => grade.id,
          'action' => 'deletion',
          'school_class_id' => school_class.id
        }
      end

      it 'nameなしでもaction=deletionで作成される' do
        service.call

        school_class_request = SchoolClassRequest.last

        expect(school_class_request.action).to eq('deletion')
        expect(school_class_request.name).to be_nil
      end
    end

    context '異常系' do
      context 'actionがcreationでnameが不足している場合' do
        let(:attributes) do
          {
            'name' => nil,
            'grade_id' => grade.id,
            'action' => 'creation',
            'school_class_id' => nil
          }
        end

        it 'RecordInvalidが発生し、作成されない' do
          expect do
            expect { service.call }.to raise_error(ActiveRecord::RecordInvalid)
          end.not_to change(SchoolClassRequest, :count)
        end

        it '通知ジョブがキューに積まれない' do
          expect do
            expect { service.call }.to raise_error(ActiveRecord::RecordInvalid)
          end.not_to have_enqueued_job(Teacher::CreateSchoolClassRequestNotificationJob)
        end
      end

      context 'grade_idが存在しない場合' do
        let(:attributes) do
          {
            'name' => '1組',
            'grade_id' => nil,
            'action' => 'creation',
            'school_class_id' => nil
          }
        end

        it 'RecordInvalidが発生する' do
          expect { service.call }.to raise_error(ActiveRecord::RecordInvalid)
        end
      end
    end
  end
end

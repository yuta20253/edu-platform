# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Teacher::CreateInterviewRequestService do
  include ActiveJob::TestHelper

  subject(:service) { described_class.new(user: teacher, student_id: student.id, reason_detail: reason_detail) }

  let!(:high_school) { create(:high_school) }
  let!(:teacher) { create(:user, :teacher, high_school: high_school) }
  let!(:student) { create(:user, :student, high_school: high_school) }
  let(:reason_detail) { '最近元気がなさそうなので話を聞きたい' }

  describe '#call' do
    it 'InterviewRequestが作成される' do
      expect { service.call }.to change(InterviewRequest, :count).by(1)
    end

    it '入力内容で作成される' do
      service.call

      interview_request = InterviewRequest.last

      expect(interview_request.student).to eq(student)
      expect(interview_request.teacher).to eq(teacher)
      expect(interview_request.initiator).to eq(teacher)
      expect(interview_request.initiator_role).to eq('teacher')
      expect(interview_request.reason_detail).to eq(reason_detail)
      expect(interview_request.status).to eq('requested')
    end

    it '通知ジョブがキューに積まれる' do
      expect { service.call }.to have_enqueued_job(Common::CreateInterviewRequestNotificationJob)
    end

    context '異常系' do
      let(:reason_detail) { '' }

      it 'RecordInvalidが発生し、作成されない' do
        expect do
          expect { service.call }.to raise_error(ActiveRecord::RecordInvalid)
        end.not_to change(InterviewRequest, :count)
      end
    end
  end
end

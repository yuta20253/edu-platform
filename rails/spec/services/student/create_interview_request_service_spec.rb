# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Student::CreateInterviewRequestService do
  include ActiveJob::TestHelper

  subject(:service) do
    described_class.new(
      user: student, teacher_id: teacher.id, reason_category: 'study_method', reason_detail: reason_detail
    )
  end

  let!(:high_school) { create(:high_school) }
  let!(:teacher) { create(:user, :teacher, high_school: high_school) }
  let!(:student) { create(:user, :student, high_school: high_school) }
  let(:reason_detail) { '勉強方法について相談したい' }

  describe '#call' do
    it 'InterviewRequestが作成される' do
      expect { service.call }.to change(InterviewRequest, :count).by(1)
    end

    it '入力内容で作成される' do
      service.call

      interview_request = InterviewRequest.last

      expect(interview_request.student).to eq(student)
      expect(interview_request.teacher).to eq(teacher)
      expect(interview_request.initiator).to eq(student)
      expect(interview_request.initiator_role).to eq('student')
      expect(interview_request.reason_category).to eq('study_method')
      expect(interview_request.status).to eq('requested')
    end

    it '通知ジョブがキューに積まれる' do
      expect { service.call }.to have_enqueued_job(Common::CreateInterviewRequestNotificationJob)
    end
  end
end

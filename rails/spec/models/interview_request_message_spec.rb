# frozen_string_literal: true

# == Schema Information
#
# Table name: interview_request_messages
#
#  id                   :bigint           not null, primary key
#  interview_request_id :bigint           not null
#  sender_id            :bigint           not null
#  body                 :text(65535)      not null
#  created_at           :datetime         not null
#  updated_at           :datetime         not null
#
require 'rails_helper'

RSpec.describe InterviewRequestMessage, type: :model do
  let!(:interview_request) { create(:interview_request, :initiated_by_teacher) }

  describe '#validate (送信者が当事者であること)' do
    it '生徒本人が送信者の場合validになる' do
      message = build(:interview_request_message, interview_request: interview_request,
                                                  sender: interview_request.student)
      expect(message).to be_valid
    end

    it '担当教員が送信者の場合validになる' do
      message = build(:interview_request_message, interview_request: interview_request,
                                                  sender: interview_request.teacher)
      expect(message).to be_valid
    end

    it '当事者以外が送信者の場合invalidになる' do
      other_teacher = create(:user, :teacher)
      message = build(:interview_request_message, interview_request: interview_request, sender: other_teacher)
      expect(message).not_to be_valid
    end
  end

  describe '#validate (終了した面談への投稿禁止)' do
    it 'completedの面談には投稿できない' do
      interview_request.update_columns(status: :completed)
      message = build(:interview_request_message, interview_request: interview_request)
      expect(message).not_to be_valid
    end

    it 'cancelledの面談には投稿できない' do
      interview_request.update_columns(status: :cancelled)
      message = build(:interview_request_message, interview_request: interview_request)
      expect(message).not_to be_valid
    end

    it 'requested/scheduling/confirmedの面談には投稿できる' do
      message = build(:interview_request_message, interview_request: interview_request)
      expect(message).to be_valid
    end
  end
end

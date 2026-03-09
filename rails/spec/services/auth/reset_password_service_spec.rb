# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Auth::ResetPasswordService do
  include ActiveJob::TestHelper

  let(:user) { create(:user) }

  describe '#call' do
    it 'ジョブをenqueueする' do
      expect { described_class.new(user).call }.to have_enqueued_job(SendResetPasswordEmailJob)
    end
  end

  context 'userがnilの場合' do
    it 'ジョブをenqueueしない' do
      expect { described_class.new(nil).call }.not_to have_enqueued_job(SendResetPasswordEmailJob)
    end
  end
end

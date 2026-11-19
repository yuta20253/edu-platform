# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Api::V1::Grades', type: :request do
  describe 'GET /api/v1/high_schools/:high_school_id/grades' do
    subject { get "/api/v1/high_schools/#{school.id}/grades" }

    let!(:school) { create(:high_school) }
    let!(:grade2) { create(:grade, high_school: school, year: 2) }
    let!(:grade1) { create(:grade, high_school: school, year: 1) }

    it 'year の昇順を明示的に指定する' do
      grades = Grade.where(high_school_id: school.id)
      allow(Grade).to receive(:where).and_return(grades)
      allow(grades).to receive(:order).and_call_original

      subject

      expect(grades).to have_received(:order).with(:year)
    end
  end
end

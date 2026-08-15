# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Teacher::SchoolClassRequest::Creation do
  subject(:service) { described_class.new(school_class_request: school_class_request) }

  let!(:high_school) { create(:high_school) }
  let!(:grade) { create(:grade, high_school: high_school) }
  let!(:applicant) { create(:user, :teacher, high_school: high_school) }

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

  describe '#call' do
    it 'SchoolClassが作成される' do
      expect { service.call }.to change(SchoolClass, :count).by(1)
    end

    it '申請内容でSchoolClassが作成される' do
      service.call

      school_class = SchoolClass.last

      expect(school_class.grade).to eq(grade)
      expect(school_class.name).to eq('1組')
    end

    context '異常系' do
      let!(:school_class_request) do
        build(
          :school_class_request,
          applicant: applicant,
          grade: grade,
          action: :creation,
          status: :pending,
          name: ''
        )
      end

      it 'nameが空の場合RecordInvalidが発生する' do
        expect { service.call }.to raise_error(ActiveRecord::RecordInvalid)
      end

      it 'SchoolClassが作成されない' do
        expect do
          expect { service.call }.to raise_error(ActiveRecord::RecordInvalid)
        end.not_to change(SchoolClass, :count)
      end
    end
  end
end

# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Teacher::SchoolClassRequest::Modification do
  subject(:service) { described_class.new(school_class_request: school_class_request) }

  let!(:high_school) { create(:high_school) }
  let!(:grade) { create(:grade, high_school: high_school) }
  let!(:applicant) { create(:user, :teacher, high_school: high_school) }
  let!(:school_class) { create(:school_class, grade: grade, name: '旧1組') }

  let!(:school_class_request) do
    create(
      :school_class_request,
      applicant: applicant,
      grade: grade,
      school_class: school_class,
      action: :modification,
      status: :pending,
      name: '新1組'
    )
  end

  describe '#call' do
    it 'SchoolClassの件数は変わらない' do
      expect { service.call }.not_to change(SchoolClass, :count)
    end

    it '申請内容でSchoolClassが更新される' do
      service.call

      expect(school_class.reload.name).to eq('新1組')
    end

    context '異常系' do
      context 'nameが空の場合' do
        let!(:school_class_request) do
          build(
            :school_class_request,
            applicant: applicant,
            grade: grade,
            school_class: school_class,
            action: :modification,
            status: :pending,
            name: ''
          )
        end

        it 'nameが空の場合RecordInvalidが発生する' do
          expect { service.call }.to raise_error(ActiveRecord::RecordInvalid)
        end
      end
    end
  end
end

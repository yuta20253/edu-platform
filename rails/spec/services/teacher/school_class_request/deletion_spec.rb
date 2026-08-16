# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Teacher::SchoolClassRequest::Deletion do
  subject(:service) { described_class.new(school_class_request: school_class_request) }

  let!(:high_school) { create(:high_school) }
  let!(:grade) { create(:grade, high_school: high_school) }
  let!(:applicant) { create(:user, :teacher, high_school: high_school) }
  let!(:school_class) { create(:school_class, grade: grade) }

  let!(:school_class_request) do
    create(
      :school_class_request,
      applicant: applicant,
      grade: grade,
      school_class: school_class,
      action: :deletion,
      status: :pending,
      name: nil
    )
  end

  describe '#call' do
    it 'SchoolClassが削除される' do
      expect { service.call }.to change(SchoolClass, :count).by(-1)
    end

    context '所属する教員がいる場合(境界値)' do
      let!(:homeroom_teacher) { create(:user, :teacher, high_school: high_school) }
      let!(:teacher_school_class) do
        create(:teacher_school_class, user: homeroom_teacher, school_class: school_class)
      end

      it '担任解除できるためSchoolClassとTeacherSchoolClassごと削除される' do
        expect { service.call }.to change(SchoolClass, :count).by(-1)
                                                              .and change(TeacherSchoolClass, :count).by(-1)
      end
    end

    context '異常系' do
      context '所属する生徒がいる場合' do
        let!(:student) do
          create(:user, :student, high_school: high_school, grade: grade, school_class: school_class)
        end

        it 'RecordNotDestroyedが発生する' do
          expect { service.call }.to raise_error(ActiveRecord::RecordNotDestroyed)
        end

        it 'SchoolClassが削除されない' do
          expect do
            expect { service.call }.to raise_error(ActiveRecord::RecordNotDestroyed)
          end.not_to change(SchoolClass, :count)
        end
      end
    end
  end
end

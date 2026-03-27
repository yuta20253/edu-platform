# frozen_string_literal: true

module Api
  module V1
    module Admin
      class HighSchoolsController < BaseController
        def index
          schools = HighSchool.includes(:prefecture)
                              .order(:id)
                              .by_prefecture(params[:prefecture_id])
                              .page(params[:page]).per(20)

          school_ids = schools.pluck(:id)
          student_counts = User.students.by_high_school(school_ids).group(:high_school_id).count
          teacher_counts = User.teachers.by_high_school(school_ids).group(:high_school_id).count

          render json: {
            schools: ActiveModelSerializers::SerializableResource.new(
              schools,
              each_serializer: ::Admin::HighSchoolSerializer,
              student_counts: student_counts,
              teacher_counts: teacher_counts
            ),
            meta: {
              current_page: schools.current_page,
              total_pages: schools.total_pages,
              total_count: schools.total_count,
              per_page: 20
            }
          }
        end

        def show
          school = HighSchool.includes(:prefecture).find(params[:id])
          student_count = User.students.by_high_school(school.id).count
          teacher_count = User.teachers.by_high_school(school.id).count

          render json: school,
                 serializer: ::Admin::HighSchoolSerializer,
                 student_counts: { school.id => student_count },
                 teacher_counts: { school.id => teacher_count }
        end
      end
    end
  end
end

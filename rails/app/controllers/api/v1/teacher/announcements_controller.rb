# frozen_string_literal: true

module Api
  module V1
    module Teacher
      class AnnouncementsController < Api::V1::Teacher::BaseController
        include TeacherStudentsScope

        CREATED_MESSAGES = {
          'draft' => 'お知らせを下書きで作成しました。',
          'scheduled' => 'お知らせの配信を予約しました。',
          'published' => 'お知らせを配信しました。'
        }.freeze

        before_action :set_announcement, only: :update
        # お知らせ一覧取得(関係するお知らせのみ)
        def index
          announcements = announcement_scope
                          .order(published_at: :desc, id: :desc)
                          .page(sanitized_page)
                          .per(sanitized_per_page)

          render json: {
            announcements: ActiveModelSerializers::SerializableResource.new(
              announcements, each_serializer: serializer_class
            ),
            meta: {
              current_page: announcements.current_page,
              total_pages: announcements.total_pages,
              total_count: announcements.total_count,
              per_page: announcements.limit_value
            }
          }
        end

        def show
          announcement = Announcement.for_user(current_user).published.find(params[:id])

          render json: announcement, serializer: AnnouncementSerializer, status: :ok
        end

        def new
          restriction = current_user.own_grade_restriction
          students = students_scope(grade_id: restriction, keyword: params[:keyword])
                     .page(sanitized_page)
                     .per(sanitized_per_page)

          render json: {
            grades: ActiveModelSerializers::SerializableResource.new(
              target_grades(restriction), each_serializer: GradeSerializer
            ),
            user_roles: ActiveModelSerializers::SerializableResource.new(
              assignable_roles, each_serializer: UserRoleSerializer
            ),
            students: {
              items: ActiveModelSerializers::SerializableResource.new(students,
                                                                      each_serializer: StudentSerializer),
              meta: {
                current_page: students.current_page,
                total_pages: students.total_pages,
                total_count: students.total_count,
                per_page: students.limit_value
              }
            },
            own_grade_restriction: restriction
          }
        end

        def create
          form = ::Teacher::CreateAnnouncementForm.new(current_user: current_user,
                                                       **create_announcement_params.to_h.symbolize_keys)

          if form.save
            render json: { message: CREATED_MESSAGES[form.announcement.status], announcement_id: form.announcement.id },
                   status: :created
          else
            render json: { errors: form.errors.full_messages }, status: :unprocessable_content
          end
        end

        def update
          if @announcement.update(update_announcement_params)
            render json: { message: 'お知らせのステータスを更新しました。' }, status: :ok
          else
            render json: { errors: @announcement.errors.full_messages }, status: :unprocessable_content
          end
        end

        private

        def set_announcement
          @announcement = current_user.announcements.find(params[:id])
        end

        def create_announcement_params
          params.require(:announcement).permit(:title, :content, :status, :scheduled_at,
                                               announcement_targets: %i[target_type grade_id user_role_id user_id])
        end

        def update_announcement_params
          params.require(:announcement).permit(:status, :scheduled_at)
        end

        def announcement_scope
          case params[:tab]
          when 'authored'
            current_user.announcements.where(system_generated: false)
          else
            Announcement.for_user(current_user).includes(:publisher).published
          end
        end

        def assignable_roles
          UserRole.where.not(name: %i[admin guardian])
        end

        def target_grades(restriction)
          restriction ? Grade.where(id: restriction) : current_user.high_school.grades
        end

        def serializer_class
          case params[:tab]
          when 'authored'
            AuthoredAnnouncementSerializer
          else
            AnnouncementSerializer
          end
        end
      end
    end
  end
end

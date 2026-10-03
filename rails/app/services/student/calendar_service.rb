# frozen_string_literal: true

module Student
  class CalendarService
    def initialize(user:, from_date:, to_date:)
      @user = user
      @from_date = from_date
      @to_date = to_date
    end

    def call
      (goal_items + task_items + interview_request_items)
        .sort_by { |item| item[:date] }
        .map { |item| item.merge(date: item[:date].strftime('%Y/%m/%d')) }
    end

    private

    def goal_items
      GoalsQuery.new(@user.goals)
                .within_period(
                  from: @from_date,
                  to: @to_date
                )
                .result
                .map do |goal|
                  { type: 'goal', id: goal.id, date: goal.due_date, title: goal.title, status: goal.status }
                end
    end

    def task_items
      TasksQuery.new(@user.tasks)
                .within_period(
                  from: @from_date,
                  to: @to_date
                )
                .result
                .map do |task|
                  { type: 'task', id: task.id, date: task.due_date, title: task.title, status: task.status }
                end
    end

    def interview_request_items
      InterviewRequestsQuery.new(InterviewRequest.all)
                            .for_participant(@user)
                            .within_period(
                              from: @from_date,
                              to: @to_date
                            )
                            .result
                            .map do |interview_request|
                              {
                                type: 'interview_request',
                                id: interview_request.id,
                                date: interview_request.scheduled_at.to_date,
                                title: interview_request.reason_detail,
                                status: interview_request.status
                              }
                            end
    end
  end
end

# frozen_string_literal: true

# == Schema Information
#
# Table name: goals
#
#  id          :bigint           not null, primary key
#  user_id     :bigint           not null
#  title       :string(255)      not null
#  description :text(65535)
#  due_date    :date
#  status      :integer          default("not_started"), not null
#  deleted_at  :datetime
#  created_at  :datetime         not null
#  updated_at  :datetime         not null
#
class Goal < ApplicationRecord
  class HasActiveTasksError < StandardError; end

  default_scope { where(deleted_at: nil) }

  belongs_to :user
  has_many :tasks, dependent: :destroy
  has_many :active_tasks, -> { where.not(status: :not_started) }, class_name: 'Task', inverse_of: :goal
  has_many :draft_tasks, dependent: :destroy

  enum :status, { not_started: 0, in_progress: 1, completed: 2 }

  # 論理削除は内部的な状態変更のため、goals_controller#update同様
  # バリデーション・コールバックなしでdeleted_atだけ更新する。
  # dependent: :restrict_with_errorはActiveRecordの物理destroyにしかフックできず
  # この論理削除とは両立しないため、active_tasksを見て自前でガードする。
  def soft_delete!
    transaction do
      lock!
      # 目標の行ロックだけでは、既存タスクのステータス更新（未着手→進行中）を止められない。
      # 紐づくタスクの行も先にロックし、判定から削除までの間の更新を待たせる。
      raise HasActiveTasksError, '進行中または完了のタスクがあるため削除できません' if tasks.lock.any? { |task| !task.not_started? }

      now = Time.current
      update_columns(deleted_at: now, updated_at: now)
    end
  end
end

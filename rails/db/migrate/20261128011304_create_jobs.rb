# frozen_string_literal: true

# Go側のジョブキュー専用テーブル。Railsのモデルからは触らない。
class CreateJobs < ActiveRecord::Migration[8.0]
  def change
    create_table :jobs do |t|
      t.string :type, null: false
      t.text :payload, limit: 16.megabytes - 1, null: false
      t.string :status, null: false, default: 'pending'
      t.integer :attempts, null: false, default: 0
      t.integer :max_attempts, null: false, default: 3
      t.datetime :run_after, null: false

      t.timestamps
    end

    add_index :jobs, %i[status run_after], name: 'idx_jobs_status_run_after'
  end
end

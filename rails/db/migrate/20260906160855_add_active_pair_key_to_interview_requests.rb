class AddActivePairKeyToInterviewRequests < ActiveRecord::Migration[7.2]
  # status: requested(0)/scheduling(1)/confirmed(2) の間だけ非NULLになる生成カラム。
  # MySQLはPostgresの部分ユニークインデックスに相当する機能を持たないため、
  # NULLは複数存在してよいというユニークインデックスの性質を利用して
  # 「同一student×teacherのactiveな面談は1件まで」をDBレベルで保証する。
  def change
    add_column :interview_requests, :active_pair_key, :virtual,
               type: :string,
               as: "CASE WHEN status IN (0, 1, 2) THEN CONCAT(student_id, '-', teacher_id) ELSE NULL END",
               stored: true

    add_index :interview_requests, :active_pair_key, unique: true,
              name: 'index_interview_requests_on_active_pair_key'
  end
end

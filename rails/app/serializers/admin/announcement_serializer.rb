# frozen_string_literal: true

module Admin
  class AnnouncementSerializer < ActiveModel::Serializer
    attributes :id, :title, :content, :status, :published_at, :scheduled_at,
               :created_at, :announcement_targets

    belongs_to :publisher, serializer: AnnouncementPublisherSerializer

    # 指定した高校宛ての行だけを返す（教員のお知らせ編集は全行を返す）。
    # 関連と同名のメソッドなので、中では必ず object.announcement_targets と書く
    def announcement_targets
      high_school_id = instance_options[:high_school_id]
      scoped_targets = object.announcement_targets.select { |t| t.high_school_id == high_school_id }

      ActiveModelSerializers::SerializableResource.new(
        scoped_targets,
        each_serializer: AnnouncementTargetSerializer
      )
    end
  end
end

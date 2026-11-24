# frozen_string_literal: true

require 'rails_helper'

RSpec.describe PublishScheduledAnnouncementsJob, type: :job do
  describe '#perform' do
    context '正常系' do
      it 'scheduledで期限を過ぎたお知らせがpublishedになる' do
        freeze_time do
          announcement = create(
            :announcement,
            :scheduled,
            scheduled_at: 1.minute.from_now
          )

          travel 2.minutes

          described_class.perform_now

          expect(announcement.reload.status).to eq('published')
        end
      end

      it 'published_atが設定される' do
        freeze_time do
          announcement = create(
            :announcement,
            :scheduled,
            scheduled_at: 1.minute.from_now
          )

          travel 2.minutes

          described_class.perform_now

          expect(announcement.reload.published_at).to eq(Time.current)
        end
      end

      it '配信後はscheduled_atがnilになる（手動配信と揃える）' do
        freeze_time do
          announcement = create(
            :announcement,
            :scheduled,
            scheduled_at: 1.minute.from_now
          )

          travel 2.minutes

          described_class.perform_now

          expect(announcement.reload.scheduled_at).to be_nil
        end
      end

      it '複数のscheduledをまとめてpublishedにする' do
        freeze_time do
          announcement1 = create(
            :announcement,
            :scheduled,
            scheduled_at: 1.minute.from_now
          )

          announcement2 = create(
            :announcement,
            :scheduled,
            scheduled_at: 1.minute.from_now
          )

          travel 2.minutes

          described_class.perform_now

          expect(announcement1.reload.status).to eq('published')
          expect(announcement2.reload.status).to eq('published')
        end
      end
    end

    context '境界値' do
      it '公開時刻前ならpublishedにならない' do
        announcement = create(
          :announcement,
          :scheduled,
          scheduled_at: 1.minute.from_now
        )

        described_class.perform_now

        expect(announcement.reload.status).to eq('scheduled')
      end

      it 'scheduled_atが現在時刻と同じならpublishedになる' do
        freeze_time do
          announcement = create(
            :announcement,
            :scheduled,
            scheduled_at: Time.current
          )

          described_class.perform_now

          expect(announcement.reload.status).to eq('published')
        end
      end
    end

    context '他プロセスが先に配信済みにした場合' do
      it 'エラーログを出さず、配信済みの状態も変えない' do
        freeze_time do
          announcement = create(
            :announcement,
            :scheduled,
            scheduled_at: 1.minute.from_now
          )

          travel 2.minutes

          # find_eachが取得した時点ではscheduledだったが、処理前に他プロセスが配信済みにした状況
          stale_announcement = Announcement.find(announcement.id)
          Announcement.find(announcement.id).update!(status: :published, scheduled_at: nil)
          published_at = announcement.reload.published_at

          relation = instance_double(ActiveRecord::Relation)
          allow(Announcement).to receive(:scheduled).and_return(relation)
          allow(relation).to receive(:where)
            .with(scheduled_at: ..Time.current)
            .and_return(relation)
          allow(relation).to receive(:find_each).and_yield(stale_announcement)

          allow(Rails.logger).to receive(:error)

          described_class.perform_now

          expect(Rails.logger).not_to have_received(:error)
          expect(announcement.reload.status).to eq('published')
          expect(announcement.published_at).to eq(published_at)
        end
      end
    end

    it '1件失敗しても他のお知らせの処理は継続する' do
      freeze_time do
        announcement1 = create(
          :announcement,
          :scheduled,
          scheduled_at: 1.minute.from_now
        )

        announcement2 = create(
          :announcement,
          :scheduled,
          scheduled_at: 1.minute.from_now
        )

        travel 2.minutes

        failed_announcement = Announcement.find(announcement1.id)
        success_announcement = Announcement.find(announcement2.id)

        allow(failed_announcement).to receive(:update!)
          .and_raise(StandardError, 'test error')

        allow(success_announcement).to receive(:update!)
          .and_call_original

        relation = instance_double(ActiveRecord::Relation)

        allow(Announcement).to receive(:scheduled).and_return(relation)

        allow(relation).to receive(:where)
          .with(scheduled_at: ..Time.current)
          .and_return(relation)

        allow(relation).to receive(:find_each).and_yield(failed_announcement).and_yield(success_announcement)

        expect do
          described_class.perform_now
        end.not_to raise_error

        expect(announcement1.reload.status).to eq('scheduled')
        expect(announcement2.reload.status).to eq('published')
      end
    end
  end
end

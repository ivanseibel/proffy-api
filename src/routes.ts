import express from 'express';
import db from './database/connection';
import convertHourToMinutes from './utils/convertHourToMinutes';

const routes = express.Router();

interface IScheduleItem {
  week_day: number;
  from: string;
  to: string;
}

routes.post('/classes', async (request, response) => {
  const { name, avatar, whatsapp, bio, subject, cost, schedule } = request.body;

  const transaction = await db.transaction();
  try {
    const createdUserIds = await transaction('users').insert({
      name,
      avatar,
      whatsapp,
      bio,
    });

    const [user_id] = createdUserIds;

    const createdClassesId = await transaction('classes').insert({
      user_id,
      subject,
      cost,
    });

    const [class_id] = createdClassesId;

    const parsedSchedule = schedule.map((item: IScheduleItem) => {
      return {
        class_id,
        week_day: item.week_day,
        from: convertHourToMinutes(item.from),
        to: convertHourToMinutes(item.to),
      };
    });

    await transaction('class_schedule').insert(parsedSchedule);

    await transaction.commit();

    response.status(201).send();
  } catch (err) {
    // eslint-disable-next-line no-console
    console.log(err);
    await transaction.rollback();
    return response
      .status(400)
      .json({ error: 'Unexpected error while creating new class' });
  }
});

export default routes;

import { Request, Response } from 'express';
import db from '../database/connection';
import convertHourToMinutes from '../utils/convertHourToMinutes';

interface IScheduleItem {
  week_day: number;
  from: string;
  to: string;
}

export default class ClassesController {
  public async index(request: Request, response: Response): Promise<Response> {
    const filters = request.query;

    const week_day = filters.week_day as string;
    const subject = filters.subject as string;
    const time = filters.time as string;

    if (!week_day || !subject || !time) {
      return response.status(400).json({
        message: 'Missing filters to search classes',
      });
    }

    const timeInMinutes = convertHourToMinutes(time);

    const classes = await db('classes')
      .select(['classes.*', 'users.*', 'class_schedule.*'])
      .innerJoin('class_schedule', 'classes.id', 'class_schedule.class_id')
      .innerJoin('users', 'classes.user_id', 'users.id')
      .where('classes.subject', 'like', `%${subject}%`)
      .where('class_schedule.week_day', '=', week_day)
      .where('class_schedule.from', '<=', timeInMinutes)
      .where('class_schedule.to', '>=', timeInMinutes);

    return response.json(classes);
  }

  public async create(request: Request, response: Response): Promise<Response> {
    const {
      name,
      avatar,
      whatsapp,
      bio,
      subject,
      cost,
      schedule,
    } = request.body;

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

      return response.status(201).send();
    } catch (err) {
      // eslint-disable-next-line no-console
      console.log(err);
      await transaction.rollback();
      return response
        .status(400)
        .json({ error: 'Unexpected error while creating new class' });
    }
  }
}

/**


 */

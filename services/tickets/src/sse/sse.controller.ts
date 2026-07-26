import { Controller, MessageEvent, Sse } from '@nestjs/common';
import { SseService } from './sse.service';
import { interval, map, merge, Observable } from 'rxjs';

@Controller('sse')
export class SseController {
  constructor(private readonly sseservice: SseService) {}

  @Sse('espacios')
  streamEspacios(): Observable<MessageEvent> {
    const events = this.sseservice.getEventStream().pipe(
      map((event) => ({
        data: JSON.stringify(event),
      })),
    );

    const heartbeat = interval(15000).pipe(
      map(() => ({ data: '', type: 'heartbeat' })),
    );

    return merge(events, heartbeat);
  }
}

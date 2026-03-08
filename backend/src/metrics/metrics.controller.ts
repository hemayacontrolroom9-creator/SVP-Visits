import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { PrometheusController } from '@willsoto/nestjs-prometheus';
import { Public } from '../common/decorators/public.decorator';

@ApiTags('Metrics')
@Controller('metrics')
export class MetricsController extends PrometheusController {
  @Get()
  @Public()
  @ApiOperation({ summary: 'Prometheus metrics endpoint' })
  async index(): Promise<string> {
    return super.index();
  }
}

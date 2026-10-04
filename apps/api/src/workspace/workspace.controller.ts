import { Body, Controller, Delete, Get, Param, Post, Put, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { SessionGuard } from '../auth/session.guard';
import { MemberAccessDto, MemberStateDto, SaveDocumentsDto } from './workspace.dto';
import { WorkspaceService } from './workspace.service';

type SessionRequest = Request & { userId: string };

@Controller('workspace')
@UseGuards(SessionGuard)
export class WorkspaceController {
  constructor(private readonly workspaces: WorkspaceService) {}

  @Get('documents')
  listDocuments(@Req() request: SessionRequest) {
    return this.workspaces.listDocuments(request.userId);
  }

  @Put('documents')
  saveDocuments(@Req() request: SessionRequest, @Body() body: SaveDocumentsDto) {
    return this.workspaces.saveDocuments(request.userId, body.entries);
  }

  @Delete('documents')
  resetDocuments(@Req() request: SessionRequest) {
    return this.workspaces.resetDocuments(request.userId);
  }

  @Post('invites/:email')
  invite(@Req() request: SessionRequest, @Param('email') email: string, @Body() body: MemberAccessDto) {
    return this.workspaces.inviteMember(request.userId, email, body);
  }

  @Put('members/:email')
  updateMember(@Req() request: SessionRequest, @Param('email') email: string, @Body() body: MemberStateDto) {
    return this.workspaces.updateMember(request.userId, email, body);
  }

  @Delete('members/:email')
  revokeMember(@Req() request: SessionRequest, @Param('email') email: string) {
    return this.workspaces.revokeMember(request.userId, email);
  }
}

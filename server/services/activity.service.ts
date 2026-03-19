import { activityRepository } from "../repositories/activity.repository";
import { notificationRepository } from "../repositories/notification.repository";
import { orderRepository } from "../repositories/order.repository";
import { userRepository } from "../repositories/user.repository";
import { registerInMediaLibrary } from "../utils/registerInMediaLibrary";

export class ActivityService {
  async getByOrderId(orderId: string) {
    return activityRepository.getByOrderId(orderId);
  }

  async create(orderId: string, userId: string, data: {
    activityType: string;
    content: string;
    mentionedUsers?: string[];
    attachments?: any[];
  }) {
    let metadata: any = {};
    if (data.attachments && Array.isArray(data.attachments) && data.attachments.length > 0) {
      metadata.attachments = data.attachments.map((att: any) => ({
        fileName: att.fileName,
        mimeType: att.mimeType,
        cloudinaryUrl: att.cloudinaryUrl,
        thumbnailUrl: att.thumbnailUrl,
      }));
    }

    const activity = await activityRepository.create({
      orderId,
      userId,
      activityType: data.activityType,
      content: data.content,
      mentionedUsers: data.mentionedUsers || [],
      isSystemGenerated: false,
      metadata,
    });

    // Send mention notifications
    if (data.mentionedUsers && data.mentionedUsers.length > 0) {
      try {
        const usersToNotify = data.mentionedUsers.filter((uid: string) => uid !== userId);
        if (usersToNotify.length > 0) {
          const order = await orderRepository.getOrder(orderId);
          const orderNumber = order?.orderNumber || orderId;
          const senderUser = await userRepository.getUser(userId);
          const senderName = senderUser ? `${senderUser.firstName} ${senderUser.lastName}`.trim() : "Someone";
          const preview = data.content.length > 100 ? data.content.substring(0, 100) + "..." : data.content;

          await notificationRepository.createForMultipleUsers(usersToNotify, {
            senderId: userId,
            orderId,
            activityId: activity.id,
            type: "mention",
            title: `${senderName} mentioned you`,
            message: `In order #${orderNumber}: "${preview}"`,
          });
        }
      } catch (notifyError) {
        console.error("Failed to create mention notifications:", notifyError);
      }
    }

    return activityRepository.getWithUser(activity.id);
  }

  async uploadFile(orderId: string, userId: string, file: Express.Multer.File) {
    const cloudinaryUrl = (file as any).path;
    const publicId = (file as any).filename || (file as any).public_id;

    const activity = await activityRepository.create({
      orderId,
      userId,
      activityType: "file_upload",
      content: `Uploaded file: ${file.originalname}`,
      mentionedUsers: [],
      isSystemGenerated: false,
      metadata: {
        fileName: file.originalname,
        fileSize: file.size,
        mimeType: file.mimetype,
        cloudinaryUrl,
        cloudinaryPublicId: publicId,
      },
    });

    // Dual-write to media library
    try {
      await registerInMediaLibrary({
        cloudinaryUrl,
        cloudinaryPublicId: publicId,
        fileName: publicId,
        originalName: file.originalname,
        fileSize: file.size,
        mimeType: file.mimetype,
        orderId,
        sourceTable: "project_activities",
        sourceId: activity.id,
        uploadedBy: userId,
      });
    } catch (mlError) {
      console.error("Failed to register in media library (non-blocking):", mlError);
    }

    return activityRepository.getWithUser(activity.id);
  }

  async getFileDownloadInfo(orderId: string, activityId: string) {
    const activity = await activityRepository.getFileActivity(orderId, activityId);

    const metadata = activity?.metadata as {
      cloudinaryUrl?: string;
      cloudinaryPublicId?: string;
      storagePath?: string;
      mimeType?: string;
      fileName?: string;
    } | undefined;

    if (!activity || (!metadata?.cloudinaryUrl && !metadata?.storagePath)) {
      return null;
    }

    return { activity, metadata };
  }
}

export const activityService = new ActivityService();
